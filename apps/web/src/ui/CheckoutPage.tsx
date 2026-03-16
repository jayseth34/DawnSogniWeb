import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { loadSession, saveSession, type CartItem, type CustomerDraft } from "../storage";

function rupees(cents: number) {
  return `\u20B9${Math.round(cents / 100)}`;
}

function linePriceText(item: CartItem) {
  if (item.unitPriceCents === 0) return "Quote pending";
  return rupees(item.unitPriceCents * item.quantity);
}

export function CheckoutPage() {
  const nav = useNavigate();
  const [session, setSession] = useState(loadSession());
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

  const subtotal = useMemo(
    () => session.cart.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
    [session.cart]
  );

  function persist(nextSession: typeof session) {
    setSession(nextSession);
    saveSession(nextSession);
  }

  function saveDraft(next: CustomerDraft) {
    setDraft(next);
    const updated = { ...session, customerDraft: next };
    persist(updated);
  }

  function explicitSave() {
    const updated = { ...session, customerDraft: draft };
    persist(updated);
    setSavedHint("Saved");
    setTimeout(() => setSavedHint(""), 1200);
  }

  function remove(index: number) {
    const nextCart = session.cart.filter((_, i) => i !== index);
    persist({ ...session, cart: nextCart });
  }

  function updateQty(index: number, nextQty: number) {
    const q = Math.max(1, Math.floor(nextQty));
    const nextCart = session.cart.map((c, i) => (i === index ? { ...c, quantity: q } : c));
    persist({ ...session, cart: nextCart });
  }

  async function placeOrder() {
    setStatus("");
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
        customer: draft,
        items,
        notes: "COD only (MVP)."
      });

      const updated = {
        ...session,
        cart: [],
        customerDraft: draft,
        orderTokens: [order.accessToken, ...(session.orderTokens ?? [])].slice(0, 50)
      };
      persist(updated);
      nav("/orders");
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    }
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="h2">Checkout</div>
      <div className="muted">
        Payment method: <b>COD only</b>. Your details can be saved and reused.
      </div>
      <div className="hr" />

      <div className="grid cards">
        <div className="card">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>Your details</div>
              <button className="btn" onClick={explicitSave}>
                Save details{savedHint ? ` (${savedHint})` : ""}
              </button>
            </div>

            <div className="label">Name</div>
            <input className="input" value={draft.name} onChange={(e) => saveDraft({ ...draft, name: e.target.value })} />
            <div className="label">Phone</div>
            <input className="input" value={draft.phone} onChange={(e) => saveDraft({ ...draft, phone: e.target.value })} />
            <div className="label">Email (optional)</div>
            <input className="input" value={draft.email ?? ""} onChange={(e) => saveDraft({ ...draft, email: e.target.value })} />
            <div className="label">Address line 1</div>
            <input
              className="input"
              value={draft.addressLine1}
              onChange={(e) => saveDraft({ ...draft, addressLine1: e.target.value })}
            />
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
              </div>
              <div style={{ flex: 1 }}>
                <div className="label">State</div>
                <input className="input" value={draft.state} onChange={(e) => saveDraft({ ...draft, state: e.target.value })} />
              </div>
              <div style={{ width: 160 }}>
                <div className="label">Pincode</div>
                <input
                  className="input"
                  value={draft.pincode}
                  onChange={(e) => saveDraft({ ...draft, pincode: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Cart</div>
              <div className="tag">Subtotal: {subtotal === 0 ? "Quote pending" : rupees(subtotal)}</div>
            </div>
            <div style={{ height: 12 }} />
            {session.cart.length === 0 && (
              <div className="muted">
                Cart is empty. <Link to="/drops">Add drops</Link> or <Link to="/bulk">add bulk</Link>.
              </div>
            )}
            <div className="grid" style={{ gap: 10 }}>
              {session.cart.map((c, idx) => (
                <div key={`${c.title}-${idx}`} className="pill" style={{ justifyContent: "space-between", width: "100%" }}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 800 }}>{c.title}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {c.kind}{c.variant ? ` · ${c.variant}` : ""}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      Line: {linePriceText(c)}
                    </div>
                  </div>

                  <div className="row">
                    <button className="btn" onClick={() => updateQty(idx, c.quantity - 1)}>
                      -
                    </button>
                    <div className="pill">Qty {c.quantity}</div>
                    <button className="btn" onClick={() => updateQty(idx, c.quantity + 1)}>
                      +
                    </button>
                    <button className="btn danger" onClick={() => remove(idx)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 14 }} />
            <button
              className="btn primary"
              onClick={placeOrder}
              disabled={
                session.cart.length === 0 ||
                !draft.name ||
                !draft.phone ||
                !draft.addressLine1 ||
                !draft.city ||
                !draft.state ||
                !draft.pincode
              }
            >
              Place COD order
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