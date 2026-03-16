import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { formatRupees } from "../money";

type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  phone: string;
  totalCents: number;
  createdAt: string;
  items?: Array<{ title: string; quantity: number }>;
};

function normalizePhone(input: string) {
  return input.replace(/[^0-9+]/g, "");
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [status, setStatus] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [qOrder, setQOrder] = useState("");
  const [qStatus, setQStatus] = useState("");

  async function load() {
    setStatus("");
    const d = await api.admin.orders();
    setOrders(d.orders as AdminOrderListItem[]);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
  }, []);

  const filtered = useMemo(() => {
    const phone = normalizePhone(qPhone.trim());
    const order = qOrder.trim().toLowerCase();
    const st = qStatus.trim().toLowerCase();

    return orders.filter((o) => {
      const matchesPhone = !phone || normalizePhone(o.phone).includes(phone);
      const matchesOrder = !order || o.orderNumber.toLowerCase().includes(order) || o.id.toLowerCase().includes(order);
      const matchesStatus = !st || o.status.toLowerCase().includes(st);
      return matchesPhone && matchesOrder && matchesStatus;
    });
  }, [orders, qPhone, qOrder, qStatus]);

  const totalOrders = orders.length;
  const shown = filtered.length;

  return (
    <div>
      <div className="adminPageTitle">
        <div>
          <div className="h2">Orders</div>
          <div className="muted">
            {shown} shown · {totalOrders} total
          </div>
        </div>
        <button className="btn" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="hr" />

      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Search</div>
          <div className="row" style={{ marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="label">Phone</div>
              <input className="input" value={qPhone} onChange={(e) => setQPhone(e.target.value)} placeholder="e.g. +91..." />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="label">Order number / ID</div>
              <input className="input" value={qOrder} onChange={(e) => setQOrder(e.target.value)} placeholder="e.g. DS-..." />
            </div>
            <div style={{ width: 220, minWidth: 220 }}>
              <div className="label">Status</div>
              <input className="input" value={qStatus} onChange={(e) => setQStatus(e.target.value)} placeholder="PLACED, SHIPPED..." />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                className="btn"
                onClick={() => {
                  setQPhone("");
                  setQOrder("");
                  setQStatus("");
                }}
                disabled={!qPhone && !qOrder && !qStatus}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />
      {status && <div className="muted">{status}</div>}

      <div className="adminList">
        {filtered.map((o) => (
          <Link key={o.id} to={`/admin/orders/${o.id}`} className="adminItem">
            <div className="adminItemInner" style={{ gridTemplateColumns: "1fr auto", gap: 12 }}>
              <div className="adminMeta">
                <div className="adminMetaTitle">{o.orderNumber}</div>
                <div className="adminMetaSub">
                  {o.customerName} · {o.phone} · {formatRupees(o.totalCents)} · {new Date(o.createdAt).toLocaleString()}
                </div>
                <div className="row" style={{ marginTop: 8, gap: 10 }}>
                  <span className="tag">ID: {o.id}</span>
                  <button
                    className="btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQPhone(o.phone);
                    }}
                  >
                    Filter phone
                  </button>
                </div>
                {(o.items ?? []).length > 0 && (
                  <div className="muted2 clamp2" style={{ marginTop: 6, fontSize: 12 }}>
                    {(o.items ?? []).map((i) => `${i.title}×${i.quantity}`).join(" · ")}
                  </div>
                )}
              </div>
              <div className="tag">{o.status}</div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="muted">No matching orders.</div>}
      </div>
    </div>
  );
}
