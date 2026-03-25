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
  for (const order of a) map.set(order.id, order);
  for (const order of b) map.set(order.id, order);
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
  const [draftMessages, setDraftMessages] = useState<Record<string, string>>({});
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { amountRupees: string; method: "UPI" | "BANK" | "CARD" | "CASH" | "OTHER"; txnRef: string; proofUrl: string; note: string }>>({});
  const [params, setParams] = useSearchParams();
  const [loadingPhoneOrders, setLoadingPhoneOrders] = useState(false);

  const tokens = useMemo(() => session.orderTokens ?? [], [session.orderTokens]);
  const placedToken = (params.get("placed") || "").trim();

  async function loadFromTokens() {
    setStatus("");
    try {
      const list: Order[] = [];
      for (const token of tokens) {
        const order = await api.getOrderByToken(token);
        list.push(order);
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
      const data = await api.customer.orders();
      setOrders((prev) => mergeOrders(prev, data.orders ?? []));
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
  }, [isAuthed, phoneDigits, tokens.join("|")]);

  async function refreshOne(order: Order) {
    if (isAuthed) {
      await loadFromPhone();
      return;
    }
    const fresh = await api.getOrderByToken(order.accessToken);
    setOrders((prev) => prev.map((item) => (item.id === fresh.id ? fresh : item)));
  }

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addToken() {
    const token = newToken.trim();
    if (!token) return;
    persist({
      ...session,
      orderTokens: [token, ...(session.orderTokens ?? [])].filter((value, index, arr) => arr.indexOf(value) === index).slice(0, 50)
    });
    setNewToken("");
  }

  const placedOrder = useMemo(() => {
    if (!placedToken) return null;
    return orders.find((order) => order.accessToken === placedToken) ?? null;
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
    <div className="container page publicPageShell">
      <div className="publicPageIntro revealSection sectionGlow">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="infoEyebrow">Order desk</div>
            <div className="h2">Track every stage of your Dawn Sogni order</div>
            <div className="muted">Saved to this device{isAuthed ? " and linked to your signed-in phone" : ""}.</div>
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
      </div>

      {uiToast && <div className="muted" style={{ marginTop: 10 }}>{uiToast}</div>}

      {placedToken && (
        <div className="card revealSection sectionGlow" style={{ marginTop: 14 }}>
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
          </div>
        </div>
      )}

      {!isAuthed && (
        <div className="card revealSection sectionGlow" style={{ marginTop: 14 }}>
          <div className="p">
            <div style={{ fontWeight: 800 }}>Add an order token</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Paste a tracking token to attach an order to this device.
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <input className="input" value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="Tracking token" />
              <button className="btn primary" onClick={addToken} disabled={!newToken.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hr" />
      {status && <div className="muted">{status}</div>}

      <div className="stackList revealSection">
        {orders.map((order) => (
          <div className="card sectionGlow" key={order.id}>
            <div className="p" style={{ cursor: "pointer" }} onClick={() => toggle(order.id)}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 900 }}>{order.orderNumber}</div>
                <div className="glassBadge active">{order.status}</div>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                Total {totalText(order)} | COD | {new Date(order.createdAt).toLocaleString()}
              </div>

              <div className="row" style={{ justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                <div className="muted2" style={{ fontSize: 12 }}>
                  Order ID: <b>{order.id}</b>
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyToClipboard("order id", order.id, setUiToast);
                  }}
                >
                  Copy
                </button>
              </div>

              <div className="row" style={{ justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                <div className="muted2" style={{ fontSize: 12 }}>
                  Token: <b>{maskToken(order.accessToken)}</b>
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyToClipboard("tracking token", order.accessToken, setUiToast);
                  }}
                >
                  Copy
                </button>
              </div>

              <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                {expanded[order.id] ? "Hide tracking" : "Show tracking"}
              </div>
            </div>

            {expanded[order.id] && (
              <div className="p" style={{ borderTop: "1px solid var(--line2)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Address: {order.addressLine1}
                    {order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.city}, {order.state} - {order.pincode}
                  </div>
                  <button
                    className="btn"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await refreshOne(order);
                    }}
                  >
                    Refresh status
                  </button>
                </div>

                <div style={{ height: 12 }} />
                <div style={{ fontWeight: 800 }}>Status timeline</div>
                <div className="timelineList">
                  {(order.events ?? []).map((event) => (
                    <div key={event.id} className="timelineItem">
                      <div>
                        <div className="timelineItemType">{event.type}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {event.message ? fixMojibake(String(event.message)) : "-"}
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {(order.events ?? []).length === 0 && <div className="muted">No status updates yet.</div>}
                </div>

                <div style={{ height: 16 }} />
                <div className="orderToolsGrid">
                  <div className="orderToolBox">
                    <div style={{ fontWeight: 800 }}>Message admin</div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                      Send any note about sizes, delivery timing, or your preferences.
                    </div>
                    <textarea
                      className="textarea"
                      value={draftMessages[order.id] ?? ""}
                      onChange={(e) =>
                        setDraftMessages((prev) => ({
                          ...prev,
                          [order.id]: e.target.value
                        }))
                      }
                      placeholder="Type your message to admin..."
                    />
                    <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        className="btn primary"
                        disabled={!(draftMessages[order.id] ?? "").trim()}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const message = (draftMessages[order.id] ?? "").trim();
                          if (!message) return;
                          setStatus("");
                          try {
                            await api.sendOrderMessageByToken(order.accessToken, message);
                            setDraftMessages((prev) => ({ ...prev, [order.id]: "" }));
                            setUiToast("Message sent");
                            setTimeout(() => setUiToast(""), 1400);
                            await refreshOne(order);
                          } catch (err: any) {
                            setStatus(`Failed: ${String(err?.message ?? err)}`);
                          }
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <div className="orderToolBox">
                    <div style={{ fontWeight: 800 }}>Report payment</div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                      If you paid the requested partial amount, submit details here so admin can verify.
                    </div>

                    <div style={{ height: 8 }} />
                    <div className="grid" style={{ gap: 10 }}>
                      <div>
                        <div className="label">Amount (INR)</div>
                        <input
                          className="input"
                          inputMode="numeric"
                          value={
                            paymentDrafts[order.id]?.amountRupees ??
                            (order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : "")
                          }
                          onChange={(e) =>
                            setPaymentDrafts((prev) => ({
                              ...prev,
                              [order.id]: {
                                amountRupees: e.target.value,
                                method: prev[order.id]?.method ?? "UPI",
                                txnRef: prev[order.id]?.txnRef ?? "",
                                proofUrl: prev[order.id]?.proofUrl ?? "",
                                note: prev[order.id]?.note ?? ""
                              }
                            }))
                          }
                          placeholder={order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : "Amount"}
                        />
                      </div>

                      <div>
                        <div className="label">Method</div>
                        <select
                          className="input"
                          value={paymentDrafts[order.id]?.method ?? "UPI"}
                          onChange={(e) =>
                            setPaymentDrafts((prev) => ({
                              ...prev,
                              [order.id]: {
                                amountRupees:
                                  prev[order.id]?.amountRupees ??
                                  (order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : ""),
                                method: e.target.value as any,
                                txnRef: prev[order.id]?.txnRef ?? "",
                                proofUrl: prev[order.id]?.proofUrl ?? "",
                                note: prev[order.id]?.note ?? ""
                              }
                            }))
                          }
                        >
                          <option value="UPI">UPI</option>
                        </select>
                      </div>

                      <div>
                        <div className="label">Transaction ref (optional)</div>
                        <input
                          className="input"
                          value={paymentDrafts[order.id]?.txnRef ?? ""}
                          onChange={(e) =>
                            setPaymentDrafts((prev) => ({
                              ...prev,
                              [order.id]: {
                                amountRupees:
                                  prev[order.id]?.amountRupees ??
                                  (order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : ""),
                                method: prev[order.id]?.method ?? "UPI",
                                txnRef: e.target.value,
                                proofUrl: prev[order.id]?.proofUrl ?? "",
                                note: prev[order.id]?.note ?? ""
                              }
                            }))
                          }
                          placeholder="UPI ref / bank UTR"
                        />
                      </div>

                      <div>
                        <div className="label">Proof URL (optional)</div>
                        <input
                          className="input"
                          value={paymentDrafts[order.id]?.proofUrl ?? ""}
                          onChange={(e) =>
                            setPaymentDrafts((prev) => ({
                              ...prev,
                              [order.id]: {
                                amountRupees:
                                  prev[order.id]?.amountRupees ??
                                  (order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : ""),
                                method: prev[order.id]?.method ?? "UPI",
                                txnRef: prev[order.id]?.txnRef ?? "",
                                proofUrl: e.target.value,
                                note: prev[order.id]?.note ?? ""
                              }
                            }))
                          }
                          placeholder="Paste screenshot link"
                        />
                      </div>

                      <div>
                        <div className="label">Note (optional)</div>
                        <textarea
                          className="textarea"
                          value={paymentDrafts[order.id]?.note ?? ""}
                          onChange={(e) =>
                            setPaymentDrafts((prev) => ({
                              ...prev,
                              [order.id]: {
                                amountRupees:
                                  prev[order.id]?.amountRupees ??
                                  (order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : ""),
                                method: prev[order.id]?.method ?? "UPI",
                                txnRef: prev[order.id]?.txnRef ?? "",
                                proofUrl: prev[order.id]?.proofUrl ?? "",
                                note: e.target.value
                              }
                            }))
                          }
                          placeholder="Anything else to mention..."
                        />
                      </div>
                    </div>

                    <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        className="btn primary"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const draft = paymentDrafts[order.id];
                          const amountText = (
                            (draft?.amountRupees ??
                              (order.partialAmountCents ? String(Math.round(order.partialAmountCents / 100)) : ""))
                          ).trim();
                          const amount = Number(amountText);
                          if (!amount || amount <= 0) {
                            setStatus("Amount is required");
                            return;
                          }
                          setStatus("");
                          try {
                            await api.reportPaymentByToken(order.accessToken, {
                              amountCents: Math.round(amount * 100),
                              method: (draft?.method ?? "UPI") as any,
                              txnRef: draft?.txnRef?.trim() || undefined,
                              proofUrl: draft?.proofUrl?.trim() || undefined,
                              note: draft?.note?.trim() || undefined
                            });
                            setUiToast("Payment submitted");
                            setTimeout(() => setUiToast(""), 1400);
                            setPaymentDrafts((prev) => ({
                              ...prev,
                              [order.id]: {
                                amountRupees: amountText,
                                method: (draft?.method ?? "UPI") as any,
                                txnRef: "",
                                proofUrl: "",
                                note: ""
                              }
                            }));
                            await refreshOne(order);
                          } catch (err: any) {
                            setStatus(`Failed: ${String(err?.message ?? err)}`);
                          }
                        }}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
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
