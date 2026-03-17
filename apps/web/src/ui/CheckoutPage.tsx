import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { type CartItem, type CustomerDraft } from "../storage";
import { useSessionApi } from "./useSession";
import { formatRupees } from "./money";

function linePriceText(item: CartItem) {
  if (item.unitPriceCents === 0) return "Quote pending";
  return formatRupees(item.unitPriceCents * item.quantity);
}

function normalizePhone(input: string) {
  return input.replace(/[^0-9+]/g, "").slice(0, 16);
}

function normalizePin(input: string) {
  return input.replace(/[^0-9]/g, "").slice(0, 8);
}

function validateDraft(d: CustomerDraft) {
  const errors: Record<string, string> = {};
  if (!d.name.trim()) errors.name = "Name is required";
  if (normalizePhone(d.phone).replace(/^\+/, "").length < 6) errors.phone = "Enter a valid phone";
  if (d.email && d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.email = "Enter a valid email";
  if (!d.addressLine1.trim()) errors.addressLine1 = "Address is required";
  if (!d.city.trim()) errors.city = "City is required";
  if (!d.state.trim()) errors.state = "State is required";
  if (normalizePin(d.pincode).length < 4) errors.pincode = "Enter a valid pincode";
  return errors;
}

export function CheckoutPage() {
  const nav = useNavigate();
  const { session, persist, removeCartItem, updateCartQty, canShop, requireLogin } = useSessionApi();

  const [draft, setDraft] = useState<CustomerDraft>(
    session.customerDraft ?? {
      name: "",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: ""
    }
  );
  const [status, setStatus] = useState<string>("");
  const [savedHint, setSavedHint] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  if (!canShop) {
    return (
      <div className="container page" style={{ maxWidth: 560 }}>
        <div className="h2">Checkout</div>
        <div className="muted">Sign in to add items to cart and place an order.</div>
        <div className="hr" />
        <button className="btn primary" onClick={requireLogin}>
          Sign in
        </button>
      </div>
    );
  }

  const subtotal = useMemo(
    () => session.cart.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
    [session.cart]
  );

  const errors = useMemo(() => validateDraft(draft), [draft]);
  const canPlace = session.cart.length > 0 && Object.keys(errors).length === 0 && !submitting;

  function saveDraft(next: CustomerDraft) {
    setDraft(next);
    persist({ ...session, customerDraft: next });
  }

  function explicitSave() {
    persist({ ...session, customerDraft: draft });
    setSavedHint("Saved");
    setTimeout(() => setSavedHint(""), 1200);
  }

  async function placeOrder() {
    if (!canPlace) return;
    setStatus("");
    setSubmitting(true);
    try {
      const items = session.cart.map((c: CartItem) => ({
        title: c.title,
        quantity: c.quantity,
        unitPriceCents: c.unitPriceCents,
        variant: c.variant,
        size: c.size,
        imageUrl: c.imageUrl,
        dropDesignId: c.dropDesignId
      }));
      const orderType = session.cart.some((c) => c.kind === "BULK") ? "BULK" : "DROP";
      const { order } = await api.createOrder({
        orderType,
        customer: {
          ...draft,
          name: draft.name.trim(),
          phone: normalizePhone(draft.phone),
          email: draft.email?.trim() || undefined,
          pincode: normalizePin(draft.pincode)
        },
        items,
        notes: "Cash on delivery."
      });

      persist({
        ...session,
        cart: [],
        customerDraft: draft,
        orderTokens: [order.accessToken, ...(session.orderTokens ?? [])].slice(0, 50)
      });

      try {
        await navigator.clipboard.writeText(order.accessToken);
      } catch {
        // ignore
      }

      nav(`/orders?placed=${encodeURIComponent(order.accessToken)}`);
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container page">
      <div className="h2">Checkout</div>
      <div className="muted">
        Payment method: <b>COD</b>.
      </div>
      <div className="hr" />

      <div className="grid cards">
        <div className="card">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>Your details</div>
              <button className="btn" onClick={explicitSave} disabled={submitting}>
                Save details{savedHint ? ` (${savedHint})` : ""}
              </button>
            </div>

            <div className="label">Name</div>
            <input className="input" value={draft.name} onChange={(e) => saveDraft({ ...draft, name: e.target.value })} />
            {errors.name && (
              <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                {errors.name}
              </div>
            )}

            <div className="label">Phone</div>
            <input
              className="input"
              value={draft.phone}
              onChange={(e) => saveDraft({ ...draft, phone: normalizePhone(e.target.value) })}
              placeholder="e.g. +91xxxxxxxxxx"
            />
            {errors.phone && (
              <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                {errors.phone}
              </div>
            )}

            <div className="label">Email (optional)</div>
            <input className="input" value={draft.email ?? ""} onChange={(e) => saveDraft({ ...draft, email: e.target.value })} />
            {errors.email && (
              <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                {errors.email}
              </div>
            )}

            <div className="label">Address line 1</div>
            <input
              className="input"
              value={draft.addressLine1}
              onChange={(e) => saveDraft({ ...draft, addressLine1: e.target.value })}
            />
            {errors.addressLine1 && (
              <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                {errors.addressLine1}
              </div>
            )}

            <div className="label">Address line 2 (optional)</div>
            <input
              className="input"
              value={draft.addressLine2 ?? ""}
              onChange={(e) => saveDraft({ ...draft, addressLine2: e.target.value })}
            />

            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="label">City</div>
                <input className="input" value={draft.city} onChange={(e) => saveDraft({ ...draft, city: e.target.value })} />
                {errors.city && (
                  <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                    {errors.city}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="label">State</div>
                <input className="input" value={draft.state} onChange={(e) => saveDraft({ ...draft, state: e.target.value })} />
                {errors.state && (
                  <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                    {errors.state}
                  </div>
                )}
              </div>
              <div style={{ width: 160 }}>
                <div className="label">Pincode</div>
                <input
                  className="input"
                  value={draft.pincode}
                  onChange={(e) => saveDraft({ ...draft, pincode: normalizePin(e.target.value) })}
                />
                {errors.pincode && (
                  <div className="muted2" style={{ fontSize: 12, marginTop: 6 }}>
                    {errors.pincode}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Cart</div>
              <div className="tag">Subtotal: {subtotal === 0 ? "Quote pending" : formatRupees(subtotal)}</div>
            </div>
            <div style={{ height: 12 }} />
            {session.cart.length === 0 && (
              <div className="muted">
                Cart is empty. <Link to="/drops">Shop</Link> or <Link to="/bulk">bulk orders</Link>.
              </div>
            )}
            <div className="grid" style={{ gap: 10 }}>
              {session.cart.map((c, idx) => (
                <div key={`${c.title}-${idx}`} className="cartItem">
                  {c.imageUrl ? <img className="cartItemImg" src={c.imageUrl} alt="" /> : <div className="cartItemImg" />}

                  <div className="cartItemInfo">
                    <div className="cartItemTitle">{c.title}</div>
                    <div className="cartItemSub">
                      {c.kind}
                      {c.variant ? ` · ${c.variant}` : ""}
                    </div>
                    <div className="cartItemSub">Line: {linePriceText(c)}</div>
                  </div>

                  <div className="cartItemActions">
                    <button className="btn" onClick={() => updateCartQty(idx, c.quantity - 1)} disabled={submitting}>
                      -
                    </button>
                    <div className="pill">Qty {c.quantity}</div>
                    <button className="btn" onClick={() => updateCartQty(idx, c.quantity + 1)} disabled={submitting}>
                      +
                    </button>
                    <button className="btn danger" onClick={() => removeCartItem(idx)} disabled={submitting}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 14 }} />
            <button className="btn primary checkoutPlaceBtn" onClick={placeOrder} disabled={!canPlace}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
            {status && (
              <div className="muted" style={{ marginTop: 12 }}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
