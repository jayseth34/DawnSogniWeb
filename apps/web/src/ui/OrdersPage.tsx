import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type Order } from "../api";
import { formatRupees } from "./money";
import { useSessionApi } from "./useSession";
import { useCustomerAuth } from "./useCustomerAuth";

function fixMojibake(input: string) {
  let out = input;
  for (let i = 0; i < 3; i++) {
    if (!/[\u00C3\u00E2]/.test(out)) break;
    try {
      const next = decodeURIComponent(escape(out));
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}


function totalText(order: Order) {
  if (order.totalCents === 0) return "Quote pending";
  return formatRupees(order.totalCents);
}

function maskToken(token: string) {
  if (!token) return "-";
  if (token.length <= 10) return token;
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

async function copyToClipboard(label: string, value: string, onStatus: (msg: string) => void) {
  try {
    await navigator.clipboard.writeText(value);
    onStatus(`${label} copied`);
    setTimeout(() => onStatus(""), 1400);
  } catch {
    try {
      window.prompt(`Copy ${label}:`, value);
    } catch {
      // ignore
    }
  }
}

function mergeOrders(a: Order[], b: Order[]) {
  const map = new Map<string, Order>();
  for (const o of a) map.set(o.id, o);
  for (const o of b) map.set(o.id, o);
  return Array.from(map.values()).sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt));
}

export function OrdersPage() {
  const { session, persist } = useSessionApi();
  const { isAuthed, phoneDigits, logout: authLogout } = useCustomerAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newToken, setNewToken] = useState("");
  const [uiToast, setUiToast] = useState("");
  const [params, setParams] = useSearchParams();

  const [loadingPhoneOrders, setLoadingPhoneOrders] = useState(false);

  const tokens = useMemo(() => session.orderTokens ?? [], [session.orderTokens]);
  const placedToken = (params.get("placed") || "").trim();

  async function loadFromTokens() {
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

  async function loadFromPhone() {
    setStatus("");
    setLoadingPhoneOrders(true);
    try {
      const d = await api.customer.orders();
      setOrders((prev) => mergeOrders(prev, d.orders ?? []));
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    } finally {
      setLoadingPhoneOrders(false);
    }
  }

  useEffect(() => {
    if (isAuthed) {
      void loadFromPhone();
    } else {
      void loadFromTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, phoneDigits, tokens.join("|")]);

  async function refreshOne(order: Order) {
    if (isAuthed) {
      await loadFromPhone();
      return;
    }
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

  const placedOrder = useMemo(() => {
    if (!placedToken) return null;
    return orders.find((o) => o.accessToken === placedToken) ?? null;
  }, [orders, placedToken]);

  function dismissPlaced() {
    const next = new URLSearchParams(params);
    next.delete("placed");
    setParams(next, { replace: true });
  }

  async function logout() {
    await authLogout();
    setUiToast("Signed out");
    setTimeout(() => setUiToast(""), 1400);
  }

  return (
    <div className="container page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Your Orders</div>
          <div className="muted">Saved to this device{isAuthed ? " | Signed in" : ""}.</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {isAuthed ? (
            <>
              <button className="btn" onClick={loadFromPhone} disabled={loadingPhoneOrders}>
                {loadingPhoneOrders ? "Loading..." : "Refresh"}
              </button>
              <button className="btn" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="btn primary" to={`/login?next=${encodeURIComponent("/orders")}`}>
                Sign in
              </Link>
              <button className="btn" onClick={loadFromTokens}>
                Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {uiToast && (
        <div className="muted" style={{ marginTop: 10 }}>
          {uiToast}
        </div>
      )}

      {placedToken && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>Order placed</div>
              <button className="btn" onClick={dismissPlaced}>
                Dismiss
              </button>
            </div>
            <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
              {placedOrder ? (
                <>
                  Order number: <b>{placedOrder.orderNumber}</b>
                  <br />
                  Order ID: <b>{placedOrder.id}</b>
                </>
              ) : (
                <>Your tracking token is ready.</>
              )}
            </div>
            <div className="hr" />
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="muted2" style={{ fontSize: 13 }}>
                Tracking token: <b>{maskToken(placedToken)}</b>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn" onClick={() => copyToClipboard("tracking token", placedToken, setUiToast)}>
                  Copy token
                </button>
                {placedOrder && (
                  <button className="btn" onClick={() => copyToClipboard("order id", placedOrder.id, setUiToast)}>
                    Copy order id
                  </button>
                )}
              </div>
            </div>
            <div className="muted2" style={{ marginTop: 10, fontSize: 12 }}>
              Keep the token safe. You can use it to track this order on any device.
            </div>
          </div>
        </div>
      )}

      {!isAuthed && (
        <>
          <div style={{ height: 12 }} />
          <div className="card">
            <div className="p">
              <div style={{ fontWeight: 800 }}>Add an order token</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                Paste a tracking token to add an order to this device.
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <input className="input" value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="Tracking token" />
                <button className="btn primary" onClick={addToken} disabled={!newToken.trim()}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
                Total {totalText(o)} | COD | {new Date(o.createdAt).toLocaleString()}
              </div>

              <div className="row" style={{ justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                <div className="muted2" style={{ fontSize: 12 }}>
                  Order ID: <b>{o.id}</b>
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyToClipboard("order id", o.id, setUiToast);
                  }}
                >
                  Copy
                </button>
              </div>

              <div className="row" style={{ justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                <div className="muted2" style={{ fontSize: 12 }}>
                  Token: <b>{maskToken(o.accessToken)}</b>
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyToClipboard("tracking token", o.accessToken, setUiToast);
                  }}
                >
                  Copy
                </button>
              </div>

              <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
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
                          {ev.message ? fixMojibake(String(ev.message)) : "-"}
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
        {orders.length === 0 && <div className="muted">No orders yet.</div>}
      </div>
    </div>
  );
}
