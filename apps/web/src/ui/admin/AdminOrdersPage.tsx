import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

function rupees(cents: number) {
  return `₹${Math.round(cents / 100)}`;
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    const d = await api.admin.orders();
    setOrders(d.orders);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
  }, []);

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="h2">Orders (admin)</div>
      <div className="muted">
        COD orders only. Accept → owner notification queued → request partial payment → track history.
      </div>
      <div className="hr" />
      {status && <div className="muted">{status}</div>}
      <div className="grid">
        {orders.map((o) => (
          <Link key={o.id} to={`/admin/orders/${o.id}`} className="card">
            <div className="p">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 900 }}>{o.orderNumber}</div>
                <div className="tag">{o.status}</div>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                {o.customerName} · {o.phone} · Total {rupees(o.totalCents)}
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                {new Date(o.createdAt).toLocaleString()} · Items: {(o.items ?? []).map((i: any) => `${i.title}×${i.quantity}`).join(" · ")}
              </div>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <div className="muted">No orders yet.</div>}
      </div>
    </div>
  );
}
