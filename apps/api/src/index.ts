import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import { clearAdminCookie, requireAdmin, setAdminCookie } from "./auth.js";
import { getImageKit } from "./imagekit.js";
import {
  adminAddCustomDesignSchema,
  adminLoginSchema,
  adminRequestPartialSchema,
  adminUpdateCustomRequestSchema,
  adminUpsertDropSchema,
  createCustomRequestSchema,
  createOrderSchema
} from "./validation.js";
import { createAccessToken, createOrderNumber, addOrderEvent } from "./orders.js";
import { healthcheck, pool, tx } from "./db.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

function groupBy<T extends Record<string, any>, K extends string>(items: T[], key: K) {
  const map = new Map<string, T[]>();
  for (const i of items) {
    const v = String(i[key]);
    const arr = map.get(v);
    if (arr) arr.push(i);
    else map.set(v, [i]);
  }
  return map;
}

app.get("/api/health", async (_req, res) => {
  try {
    const ok = await healthcheck();
    res.json({ ok });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// -------- Public (Customer-facing) --------
app.get("/api/drops", async (_req, res) => {
  const r = await pool.query(
    `select
      id,
      title,
      description,
      price_cents as "priceCents",
      category,
      images,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from drop_designs
    where is_active = true
    order by created_at desc`
  );
  res.json({ drops: r.rows });
});

app.post("/api/custom-requests", async (req, res) => {
  const parsed = createCustomRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const r = await pool.query(
    `insert into custom_requests (customer_name, phone, notes, reference_images)
     values ($1, $2, $3, $4)
     returning
      id,
      customer_name as "customerName",
      phone,
      notes,
      reference_images as "referenceImages",
      status,
      approx_price_low as "approxPriceLow",
      approx_price_high as "approxPriceHigh",
      quoted_price_cents as "quotedPriceCents",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      parsed.data.customerName,
      parsed.data.phone,
      parsed.data.notes ?? null,
      parsed.data.referenceImages ?? []
    ]
  );

  res.json({ customRequest: r.rows[0] });
});

app.post("/api/orders", async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const subtotal = parsed.data.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const shippingCents = 0;
  const total = subtotal + shippingCents;

  const orderNumber = createOrderNumber();
  const accessToken = createAccessToken();

  const result = await tx(async (client) => {
    const orderR = await client.query(
      `insert into orders (
        order_number, access_token, order_type, status, payment_method,
        customer_name, phone, email,
        address_line1, address_line2, city, state, pincode,
        subtotal_cents, shipping_cents, total_cents,
        partial_amount_cents, notes
      ) values (
        $1,$2,$3,'PLACED','COD',
        $4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,
        $15,$16
      )
      returning
        id,
        order_number as "orderNumber",
        access_token as "accessToken",
        order_type as "orderType",
        status,
        payment_method as "paymentMethod",
        customer_name as "customerName",
        phone,
        email,
        address_line1 as "addressLine1",
        address_line2 as "addressLine2",
        city,
        state,
        pincode,
        subtotal_cents as "subtotalCents",
        shipping_cents as "shippingCents",
        total_cents as "totalCents",
        partial_amount_cents as "partialAmountCents",
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [
        orderNumber,
        accessToken,
        parsed.data.orderType,
        parsed.data.customer.name,
        parsed.data.customer.phone,
        parsed.data.customer.email ?? null,
        parsed.data.customer.addressLine1,
        parsed.data.customer.addressLine2 ?? null,
        parsed.data.customer.city,
        parsed.data.customer.state,
        parsed.data.customer.pincode,
        subtotal,
        shippingCents,
        total,
        null,
        parsed.data.notes ?? null
      ]
    );

    const order = orderR.rows[0];

    const items: any[] = [];
    for (const i of parsed.data.items) {
      const itemR = await client.query(
        `insert into order_items (
          order_id, quantity, unit_price_cents, title, variant, size, image_url, drop_design_id, custom_request_id
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        returning
          id,
          order_id as "orderId",
          quantity,
          unit_price_cents as "unitPriceCents",
          title,
          variant,
          size,
          image_url as "imageUrl",
          drop_design_id as "dropDesignId",
          custom_request_id as "customRequestId",
          created_at as "createdAt"`,
        [
          order.id,
          i.quantity,
          i.unitPriceCents,
          i.title,
          i.variant ?? null,
          i.size ?? null,
          i.imageUrl ?? null,
          i.dropDesignId ?? null,
          i.customRequestId ?? null
        ]
      );
      items.push(itemR.rows[0]);
    }

    await addOrderEvent(client, { orderId: order.id, type: "ORDER_PLACED", message: "Order placed (COD)." });

    return { order, items };
  });

  res.json({ order: { ...result.order, items: result.items } });
});

app.get("/api/orders/by-token/:token", async (req, res) => {
  const token = req.params.token;

  const orderR = await pool.query(
    `select
      id,
      order_number as "orderNumber",
      access_token as "accessToken",
      order_type as "orderType",
      status,
      payment_method as "paymentMethod",
      customer_name as "customerName",
      phone,
      email,
      address_line1 as "addressLine1",
      address_line2 as "addressLine2",
      city,
      state,
      pincode,
      subtotal_cents as "subtotalCents",
      shipping_cents as "shippingCents",
      total_cents as "totalCents",
      partial_amount_cents as "partialAmountCents",
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from orders
    where access_token = $1`,
    [token]
  );

  const order = orderR.rows[0];
  if (!order) return res.status(404).json({ error: "Order not found" });

  const itemsR = await pool.query(
    `select
      id,
      order_id as "orderId",
      quantity,
      unit_price_cents as "unitPriceCents",
      title,
      variant,
      size,
      image_url as "imageUrl",
      created_at as "createdAt"
    from order_items
    where order_id = $1
    order by created_at asc`,
    [order.id]
  );

  const eventsR = await pool.query(
    `select id, order_id as "orderId", type, message, created_at as "createdAt"
     from order_events
     where order_id = $1
     order by created_at asc`,
    [order.id]
  );

  res.json({ order: { ...order, items: itemsR.rows, events: eventsR.rows } });
});

app.post("/api/public/imagekit/auth", (_req, res) => {
  const ik = getImageKit();
  if (!ik) return res.status(501).json({ error: "ImageKit not configured" });
  res.json({ ...ik.getAuthenticationParameters(), publicKey: env.IMAGEKIT_PUBLIC_KEY });
});

// -------- Admin --------
app.post("/api/admin/login", (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (parsed.data.passcode !== env.ADMIN_PASSCODE) return res.status(401).json({ error: "Invalid passcode" });
  setAdminCookie(res);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

app.get("/api/admin/me", requireAdmin, (_req, res) => res.json({ role: "admin" }));

app.post("/api/admin/imagekit/auth", requireAdmin, (_req, res) => {
  const ik = getImageKit();
  if (!ik) return res.status(501).json({ error: "ImageKit not configured" });
  res.json({ ...ik.getAuthenticationParameters(), publicKey: env.IMAGEKIT_PUBLIC_KEY });
});

// Drops CRUD
app.get("/api/admin/drops", requireAdmin, async (_req, res) => {
  const r = await pool.query(
    `select
      id,
      title,
      description,
      price_cents as "priceCents",
      category,
      images,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from drop_designs
    order by created_at desc`
  );
  res.json({ drops: r.rows });
});

app.post("/api/admin/drops", requireAdmin, async (req, res) => {
  const parsed = adminUpsertDropSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const r = await pool.query(
    `insert into drop_designs (title, description, price_cents, category, images, is_active)
     values ($1,$2,$3,$4,$5,$6)
     returning
      id,
      title,
      description,
      price_cents as "priceCents",
      category,
      images,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      parsed.data.title,
      parsed.data.description ?? null,
      parsed.data.priceCents,
      parsed.data.category ?? null,
      parsed.data.images ?? [],
      parsed.data.isActive ?? true
    ]
  );

  res.json({ drop: r.rows[0] });
});

app.put("/api/admin/drops/:id", requireAdmin, async (req, res) => {
  const parsed = adminUpsertDropSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const r = await pool.query(
    `update drop_designs
     set title=$2, description=$3, price_cents=$4, category=$5, images=$6, is_active=$7
     where id=$1
     returning
      id,
      title,
      description,
      price_cents as "priceCents",
      category,
      images,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      req.params.id,
      parsed.data.title,
      parsed.data.description ?? null,
      parsed.data.priceCents,
      parsed.data.category ?? null,
      parsed.data.images ?? [],
      parsed.data.isActive ?? true
    ]
  );

  res.json({ drop: r.rows[0] });
});

app.delete("/api/admin/drops/:id", requireAdmin, async (req, res) => {
  await pool.query("delete from drop_designs where id=$1", [req.params.id]);
  res.json({ ok: true });
});

// Custom requests
app.get("/api/admin/custom-requests", requireAdmin, async (_req, res) => {
  const reqR = await pool.query(
    `select
      id,
      customer_name as "customerName",
      phone,
      notes,
      reference_images as "referenceImages",
      status,
      approx_price_low as "approxPriceLow",
      approx_price_high as "approxPriceHigh",
      quoted_price_cents as "quotedPriceCents",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from custom_requests
    order by created_at desc`
  );

  const ids = reqR.rows.map((r: { id: any; }) => r.id);
  let designs: any[] = [];
  if (ids.length) {
    const desR = await pool.query(
      `select
        id,
        custom_request_id as "customRequestId",
        images,
        notes,
        created_at as "createdAt"
      from custom_designs
      where custom_request_id = any($1::uuid[])
      order by created_at desc`,
      [ids]
    );
    designs = desR.rows;
  }

  const byReq = groupBy(designs, "customRequestId");
  const customRequests = reqR.rows.map((r: { id: any; }) => ({ ...r, designs: byReq.get(String(r.id)) ?? [] }));
  res.json({ customRequests });
});

app.patch("/api/admin/custom-requests/:id", requireAdmin, async (req, res) => {
  const parsed = adminUpdateCustomRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const r = await pool.query(
    `update custom_requests
     set
      status = coalesce($2, status),
      quoted_price_cents = coalesce($3, quoted_price_cents),
      notes = coalesce($4, notes)
     where id = $1
     returning
      id,
      customer_name as "customerName",
      phone,
      notes,
      reference_images as "referenceImages",
      status,
      approx_price_low as "approxPriceLow",
      approx_price_high as "approxPriceHigh",
      quoted_price_cents as "quotedPriceCents",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [req.params.id, parsed.data.status ?? null, parsed.data.quotedPriceCents ?? null, parsed.data.notes ?? null]
  );

  const customRequest = r.rows[0];
  const designsR = await pool.query(
    `select id, custom_request_id as "customRequestId", images, notes, created_at as "createdAt"
     from custom_designs where custom_request_id = $1 order by created_at desc`,
    [req.params.id]
  );

  res.json({ customRequest: { ...customRequest, designs: designsR.rows } });
});

app.post("/api/admin/custom-requests/:id/designs", requireAdmin, async (req, res) => {
  const parsed = adminAddCustomDesignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const r = await pool.query(
    `insert into custom_designs (custom_request_id, images, notes)
     values ($1,$2,$3)
     returning id, custom_request_id as "customRequestId", images, notes, created_at as "createdAt"`,
    [req.params.id, parsed.data.images, parsed.data.notes ?? null]
  );

  res.json({ design: r.rows[0] });
});

// Orders
app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
  const orderR = await pool.query(
    `select
      id,
      order_number as "orderNumber",
      order_type as "orderType",
      status,
      payment_method as "paymentMethod",
      customer_name as "customerName",
      phone,
      email,
      address_line1 as "addressLine1",
      address_line2 as "addressLine2",
      city,
      state,
      pincode,
      subtotal_cents as "subtotalCents",
      shipping_cents as "shippingCents",
      total_cents as "totalCents",
      partial_amount_cents as "partialAmountCents",
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from orders
    order by created_at desc`
  );

  const ids = orderR.rows.map((o: { id: any; }) => o.id);
  let items: any[] = [];
  if (ids.length) {
    const itemsR = await pool.query(
      `select
        id,
        order_id as "orderId",
        quantity,
        unit_price_cents as "unitPriceCents",
        title,
        variant,
        size,
        image_url as "imageUrl",
        created_at as "createdAt"
      from order_items
      where order_id = any($1::uuid[])
      order by created_at asc`,
      [ids]
    );
    items = itemsR.rows;
  }

  const byOrder = groupBy(items, "orderId");
  const orders = orderR.rows.map((o: { id: any; }) => ({ ...o, items: byOrder.get(String(o.id)) ?? [] }));

  res.json({ orders });
});

app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
  const orderR = await pool.query(
    `select
      id,
      order_number as "orderNumber",
      order_type as "orderType",
      status,
      payment_method as "paymentMethod",
      customer_name as "customerName",
      phone,
      email,
      address_line1 as "addressLine1",
      address_line2 as "addressLine2",
      city,
      state,
      pincode,
      subtotal_cents as "subtotalCents",
      shipping_cents as "shippingCents",
      total_cents as "totalCents",
      partial_amount_cents as "partialAmountCents",
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from orders
    where id = $1`,
    [req.params.id]
  );

  const order = orderR.rows[0];
  if (!order) return res.status(404).json({ error: "Order not found" });

  const itemsR = await pool.query(
    `select
      id,
      order_id as "orderId",
      quantity,
      unit_price_cents as "unitPriceCents",
      title,
      variant,
      size,
      image_url as "imageUrl",
      created_at as "createdAt"
    from order_items
    where order_id = $1
    order by created_at asc`,
    [req.params.id]
  );

  const eventsR = await pool.query(
    `select id, order_id as "orderId", type, message, created_at as "createdAt"
     from order_events
     where order_id = $1
     order by created_at asc`,
    [req.params.id]
  );

  const notR = await pool.query(
    `select
      id,
      order_id as "orderId",
      channel,
      to_address as "to",
      payload,
      status,
      created_at as "createdAt",
      sent_at as "sentAt",
      error
     from owner_notifications
     where order_id = $1
     order by created_at desc`,
    [req.params.id]
  );

  res.json({ order: { ...order, items: itemsR.rows, events: eventsR.rows, notifications: notR.rows } });
});

app.post("/api/admin/orders/:id/accept", requireAdmin, async (req, res) => {
  const updated = await tx(async (client) => {
    const upR = await client.query(
      `update orders set status='ADMIN_ACCEPTED' where id=$1
       returning id, order_number as "orderNumber", customer_name as "customerName", phone`,
      [req.params.id]
    );
    const o = upR.rows[0];
    if (!o) return null;

    await addOrderEvent(client, {
      orderId: o.id,
      type: "ADMIN_ACCEPTED",
      message: "Admin accepted the order. Ask for partial payment for acceptance."
    });

    const to = env.OWNER_NOTIFY_TO || "owner";
    await client.query(
      `insert into owner_notifications (order_id, channel, to_address, payload)
       values ($1,$2,$3,$4)`,
      [
        o.id,
        "OWNER_MESSAGE",
        to,
        {
          kind: "ORDER_ACCEPTED",
          orderNumber: o.orderNumber,
          phone: o.phone,
          customerName: o.customerName
        }
      ]
    );

    return o;
  });

  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json({ order: updated });
});

app.post("/api/admin/orders/:id/request-partial", requireAdmin, async (req, res) => {
  const parsed = adminRequestPartialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await tx(async (client) => {
    const upR = await client.query(
      `update orders
       set status='PARTIAL_REQUESTED', partial_amount_cents=$2
       where id=$1
       returning id`,
      [req.params.id, parsed.data.amountCents]
    );
    const o = upR.rows[0];
    if (!o) return null;

    await addOrderEvent(client, {
      orderId: req.params.id,
      type: "PARTIAL_REQUESTED",
      message: `Requested partial payment: ₹${Math.round(parsed.data.amountCents / 100)}`
    });

    return o;
  });

  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json({ order: updated });
});

app.post("/api/admin/orders/:id/mark-partial-paid", requireAdmin, async (req, res) => {
  const updated = await tx(async (client) => {
    const upR = await client.query(
      `update orders set status='PARTIAL_PAID' where id=$1 returning id`,
      [req.params.id]
    );
    const o = upR.rows[0];
    if (!o) return null;

    await addOrderEvent(client, { orderId: req.params.id, type: "PARTIAL_PAID", message: "Partial payment marked as received." });
    return o;
  });

  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json({ order: updated });
});

app.post("/api/admin/orders/:id/mark-shipped", requireAdmin, async (req, res) => {
  const updated = await tx(async (client) => {
    const upR = await client.query(`update orders set status='SHIPPED' where id=$1 returning id`, [req.params.id]);
    const o = upR.rows[0];
    if (!o) return null;
    await addOrderEvent(client, { orderId: req.params.id, type: "SHIPPED", message: "Order shipped." });
    return o;
  });

  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json({ order: updated });
});

app.post("/api/admin/orders/:id/mark-delivered", requireAdmin, async (req, res) => {
  const updated = await tx(async (client) => {
    const upR = await client.query(`update orders set status='DELIVERED' where id=$1 returning id`, [req.params.id]);
    const o = upR.rows[0];
    if (!o) return null;
    await addOrderEvent(client, { orderId: req.params.id, type: "DELIVERED", message: "Order delivered." });
    return o;
  });

  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json({ order: updated });
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

const port = 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
