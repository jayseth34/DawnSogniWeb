import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { formatRupees } from "../money";

function moneyText(cents: number | null | undefined) {
  if (cents == null) return "-";
  if (cents === 0) return "Quote pending";
  return formatRupees(cents);
}

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

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [partial, setPartial] = useState(20000);
  const [stageNote, setStageNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    const d = await api.admin.order(id);
    setData(d.order);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
  }, [id]);

  const itemsText = useMemo(
    () => (data?.items ?? []).map((i: any) => `${i.title} x ${i.quantity}`).join(" | "),
    [data]
  );

  const lastPaymentReport = useMemo(() => {
    const events = (data?.events ?? []) as any[];
    const last = events.filter((e) => String(e.type) === "PAYMENT_SUBMITTED").slice(-1)[0];
    return last ?? null;
  }, [data]);

  if (!data)
    return (
      <div className="muted" style={{ paddingTop: 18 }}>
        Loading...
      </div>
    );

  const disableUpdates = saving || data.status === "CANCELLED" || data.status === "DELIVERED";

  async function act(fn: () => Promise<any>) {
    setStatus("");
    setSaving(true);
    try {
      await fn();
      await load();
    } catch (e: any) {
      setStatus(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">{data.orderNumber}</div>
          <div className="muted">
            {data.customerName} | {data.phone} | {data.paymentMethod}
          </div>
        </div>
        <div className="tag">{data.status}</div>
      </div>
      <div className="hr" />
      {status && <div className="muted">{status}</div>}

      <div className="grid cards">
        <div className="card">
          <div className="p">
            <div style={{ fontWeight: 900 }}>Order</div>
            <div className="muted" style={{ marginTop: 8 }}>
              Total {moneyText(data.totalCents)} | Items: {itemsText || "-"}
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              Address: {data.addressLine1}
              {data.addressLine2 ? `, ${data.addressLine2}` : ""}, {data.city}, {data.state} - {data.pincode}
            </div>

            <div style={{ height: 12 }} />
            <div className="label">Stage note (optional)</div>
            <textarea
              className="textarea"
              value={stageNote}
              onChange={(e) => setStageNote(e.target.value)}
              placeholder="Example: UPI/Bank details, tracking id, timeline, etc"
            />

            <div style={{ height: 12 }} />
            <div className="label">Message customer</div>
            <textarea
              className="textarea"
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              placeholder="Write a message the customer will see in their order timeline"
            />
            <div style={{ height: 10 }} />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={() =>
                  act(async () => {
                    const msg = adminMessage.trim();
                    if (!msg) return;
                    await api.admin.sendOrderMessage(data.id, msg);
                    setAdminMessage("");
                  })
                }
                disabled={saving || !adminMessage.trim()}
              >
                Send message
              </button>
            </div>
            <div style={{ height: 10 }} />
            <div className="row">
              <button
                className="btn primary"
                onClick={() =>
                  act(async () => {
                    await api.admin.acceptOrder(data.id, stageNote.trim() || undefined);
                    setStageNote("");
                  })
                }
                disabled={disableUpdates}
              >
                Accept
              </button>
              <button
                className="btn"
                onClick={() =>
                  act(async () => {
                    await api.admin.markShipped(data.id, stageNote.trim() || undefined);
                    setStageNote("");
                  })
                }
                disabled={disableUpdates}
              >
                Mark shipped
              </button>
              <button
                className="btn"
                onClick={() =>
                  act(async () => {
                    await api.admin.markDelivered(data.id, stageNote.trim() || undefined);
                    setStageNote("");
                  })
                }
                disabled={disableUpdates}
              >
                Mark delivered
              </button>
            </div>

            <div className="hr" />
            <div style={{ fontWeight: 900 }}>Partial payment</div>
            <div className="muted" style={{ marginTop: 8 }}>Requested: {moneyText(data.partialAmountCents)}</div>
            {lastPaymentReport && (
              <div className="pill" style={{ width: "100%", justifyContent: "space-between", marginTop: 10 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>Customer reported payment</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {lastPaymentReport.message ? fixMojibake(String(lastPaymentReport.message)) : "-"}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{new Date(lastPaymentReport.createdAt).toLocaleString()}</div>
              </div>
            )}
            <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ width: 160 }}
                type="number"
                value={Math.round(partial / 100)}
                onChange={(e) => setPartial(Number(e.target.value) * 100)}
              />
              <button
                className="btn"
                onClick={() =>
                  act(async () => {
                    await api.admin.requestPartial(data.id, partial, stageNote.trim() || undefined);
                    setStageNote("");
                  })
                }
                disabled={disableUpdates}
              >
                Request
              </button>
              <button
                className="btn"
                onClick={() =>
                  act(async () => {
                    await api.admin.markPartialPaid(data.id, stageNote.trim() || undefined);
                    setStageNote("");
                  })
                }
                disabled={disableUpdates}
              >
                Mark paid
              </button>
            </div>

            <div className="hr" />
            <div style={{ fontWeight: 900 }}>Reject / cancel</div>
            <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              This will update status to CANCELLED and show the reason to the customer.
            </div>
            <div style={{ height: 8 }} />
            <textarea
              className="textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (required)"
            />
            <div style={{ height: 10 }} />
            <button
              className="btn"
              onClick={() => {
                const reason = cancelReason.trim();
                if (!reason) return;
                if (!window.confirm("Cancel this order?")) return;
                void act(async () => {
                  await api.admin.cancelOrder(data.id, reason);
                  setCancelReason("");
                });
              }}
              disabled={disableUpdates || !cancelReason.trim()}
            >
              Cancel order
            </button>
          </div>
        </div>

        <div className="card">
          <div className="p">
            <div style={{ fontWeight: 900 }}>History</div>
            <div style={{ height: 10 }} />
            <div className="grid" style={{ gap: 10 }}>
              {(data.events ?? []).map((e: any) => (
                <div className="pill" key={e.id} style={{ width: "100%", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{e.type}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{e.message ? fixMojibake(String(e.message)) : "-"}</div>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{new Date(e.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {(data.events ?? []).length === 0 && <div className="muted">No events yet.</div>}
            </div>

            <div className="hr" />
            <div style={{ fontWeight: 900 }}>Owner notifications</div>
            <div className="grid" style={{ gap: 10, marginTop: 10 }}>
              {(data.notifications ?? []).map((n: any) => (
                <div className="pill" key={n.id} style={{ width: "100%", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{n.status}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {n.channel} {"\u2192"} {n.to}
                    </div>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {(data.notifications ?? []).length === 0 && <div className="muted">No notifications.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
