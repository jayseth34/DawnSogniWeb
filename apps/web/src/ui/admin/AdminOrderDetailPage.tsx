import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { formatRupees } from "../money";

function moneyText(cents: number | null | undefined) {
  if (cents == null) return "—";
  if (cents === 0) return "Quote pending";
  return formatRupees(cents);
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [partial, setPartial] = useState(20000);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    const d = await api.admin.order(id);
    setData(d.order);
  }

  useEffect(() => {
    load().catch((e) => setStatus(String(e?.message ?? e)));
  }, [id]);

  const itemsText = useMemo(() => (data?.items ?? []).map((i: any) => `${i.title} × ${i.quantity}`).join(" · "), [data]);

  if (!data)
    return (
      <div className="muted" style={{ paddingTop: 18 }}>
        Loading…
      </div>
    );

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
            {data.customerName} · {data.phone} · {data.paymentMethod}
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
              Total {moneyText(data.totalCents)} · Items: {itemsText || "—"}
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              Address: {data.addressLine1}
              {data.addressLine2 ? `, ${data.addressLine2}` : ""}, {data.city}, {data.state} - {data.pincode}
            </div>

            <div style={{ height: 12 }} />
            <div className="row">
              <button className="btn primary" onClick={() => act(() => api.admin.acceptOrder(data.id))} disabled={saving}>
                Accept
              </button>
              <button className="btn" onClick={() => act(() => api.admin.markShipped(data.id))} disabled={saving}>
                Mark shipped
              </button>
              <button className="btn" onClick={() => act(() => api.admin.markDelivered(data.id))} disabled={saving}>
                Mark delivered
              </button>
            </div>

            <div className="hr" />
            <div style={{ fontWeight: 900 }}>Partial payment</div>
            <div className="muted" style={{ marginTop: 8 }}>Requested: {moneyText(data.partialAmountCents)}</div>
            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                style={{ width: 160 }}
                type="number"
                value={Math.round(partial / 100)}
                onChange={(e) => setPartial(Number(e.target.value) * 100)}
              />
              <button className="btn" onClick={() => act(() => api.admin.requestPartial(data.id, partial))} disabled={saving}>
                Request
              </button>
              <button className="btn" onClick={() => act(() => api.admin.markPartialPaid(data.id))} disabled={saving}>
                Mark paid
              </button>
            </div>
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
                    <div className="muted" style={{ fontSize: 12 }}>{e.message ?? "—"}</div>
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
                      {n.channel} → {n.to}
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
