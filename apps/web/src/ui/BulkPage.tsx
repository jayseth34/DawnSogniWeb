import { useMemo, useState } from "react";
import { loadSession, saveSession } from "../storage";

export function BulkPage() {
  const [session, setSession] = useState(loadSession());
  const [productType, setProductType] = useState<"collar" | "round neck" | "oversized">("oversized");
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState("");

  const cartCount = useMemo(() => session.cart.reduce((s, i) => s + i.quantity, 0), [session.cart]);

  function add() {
    const q = Math.max(1, Math.floor(Number(quantity) || 1));
    const title = `Bulk T-Shirts (${productType})`;
    const variant = `type=${productType}${notes ? ` | ${notes}` : ""}`;

    const next = {
      ...session,
      cart: [
        ...session.cart,
        {
          kind: "BULK" as const,
          title,
          unitPriceCents: 0,
          quantity: q,
          variant
        }
      ]
    };
    setSession(next);
    saveSession(next);
  }

  return (
    <div style={{ paddingTop: 18, maxWidth: 760 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Bulk orders</div>
          <div className="muted">Collar, round neck, oversized. COD only for now (pricing can be confirmed after order).</div>
        </div>
        <div className="pill">Cart items: {cartCount}</div>
      </div>
      <div className="hr" />

      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Create a bulk item</div>

          <div className="label">T-shirt type</div>
          <div className="row">
            {(["collar", "round neck", "oversized"] as const).map((t) => (
              <button key={t} className={t === productType ? "btn primary" : "btn"} onClick={() => setProductType(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="label">Quantity</div>
          <div className="row">
            <button className="btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              -
            </button>
            <input
              className="input"
              style={{ width: 140 }}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
            <button className="btn" onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>

          <div className="label">Notes (optional)</div>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div style={{ height: 12 }} />
          <button className="btn primary" onClick={add}>
            Add to cart
          </button>
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Tip: You can track order status in “Your Orders” after placing.
          </div>
        </div>
      </div>
    </div>
  );
}