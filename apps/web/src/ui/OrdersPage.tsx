import { useEffect, useMemo, useState } from "react";
import { api, type Order } from "../api";
import { useSessionApi } from "./useSession";
import { formatRupees } from "./money";

function totalText(order: Order) {
  if (order.totalCents === 0) return "Quote pending";
  return formatRupees(order.totalCents);
}

export function OrdersPage() {
  const { session, persist } = useSessionApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newToken, setNewToken] = useState("");

  const tokens = useMemo(() => session.orderTokens ?? [], [session.orderTokens]);

  async function fetchAll() {
    setStatus("");
    try {
      const list: Order[] = [];
      for (const t of tokens) {
        const o = await api.getOrderByToken(t);
        list.push(o);
      }
      setOrders(list);
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.join("|")]);

  async function refreshOne(order: Order) {
    const fresh = await api.getOrderByToken(order.accessToken);
    setOrders((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
  }

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  function addToken() {
    const t = newToken.trim();
    if (!t) return;
    persist({
      ...session,
      orderTokens: [t, ...(session.orderTokens ?? [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 50)
    });
    setNewToken("");
  }

  return (
    <div className="container page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Your Orders</div>
          <div className="muted">Saved on this device (no login yet). Click an order to expand tracking.</div>
        </div>
        <button className="btn" onClick={fetchAll}>
          Refresh all
        </button>
      </div>

      <div style={{ height: 12 }} />
      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Track an older order</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            If you have an order tracking token, paste it here to add it to your history on this device.
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input className="input" value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="Order token" />
            <button className="btn primary" onClick={addToken} disabled={!newToken.trim()}>
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="hr" />
      {status && <div className="muted">{status}</div>}

      <div className="grid">
        {orders.map((o) => (
          <div className="card" key={o.id}>
            <div className="p" style={{ cursor: "pointer" }} onClick={() => toggle(o.id)}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 900 }}>{o.orderNumber}</div>
                <div className="tag">{o.status}</div>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Total {totalText(o)} · COD · {new Date(o.createdAt).toLocaleString()}
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                {o.items.map((i) => `${i.title} × ${i.quantity}`).join(" · ")}
              </div>
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                {expanded[o.id] ? "Hide tracking" : "Show tracking"}
              </div>
            </div>

            {expanded[o.id] && (
              <div className="p" style={{ borderTop: "1px solid var(--line2)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Address: {o.addressLine1}
                    {o.addressLine2 ? `, ${o.addressLine2}` : ""}, {o.city}, {o.state} - {o.pincode}
                  </div>
                  <button
                    className="btn"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await refreshOne(o);
                    }}
                  >
                    Refresh status
                  </button>
                </div>

                <div style={{ height: 12 }} />
                <div style={{ fontWeight: 800 }}>Status timeline</div>
                <div className="grid" style={{ gap: 10, marginTop: 10 }}>
                  {(o.events ?? []).map((ev) => (
                    <div key={ev.id} className="pill" style={{ width: "100%", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{ev.type}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {ev.message ?? "—"}
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {new Date(ev.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {(o.events ?? []).length === 0 && <div className="muted">No status updates yet.</div>}
                </div>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && <div className="muted">No orders on this device yet.</div>}
      </div>
    </div>
  );
}
