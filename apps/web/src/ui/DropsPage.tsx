import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type DropDesign } from "../api";
import { loadSession, saveSession, type CartItem } from "../storage";

function rupees(cents: number) {
  return `\u20B9${Math.round(cents / 100)}`;
}

export function DropsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const [session, setSession] = useState(loadSession());

  const count = useMemo(() => session.cart.reduce((s, i) => s + i.quantity, 0), [session.cart]);

  function add(drop: DropDesign) {
    const existing = session.cart.find((c) => c.kind === "DROP" && c.dropDesignId === drop.id);
    let nextCart: CartItem[];
    if (existing) {
      nextCart = session.cart.map((c) =>
        c.kind === "DROP" && c.dropDesignId === drop.id ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      nextCart = [
        ...session.cart,
        {
          kind: "DROP",
          dropDesignId: drop.id,
          title: drop.title,
          unitPriceCents: drop.priceCents,
          quantity: 1,
          imageUrl: drop.images[0]
        }
      ];
    }
    const next = { ...session, cart: nextCart };
    setSession(next);
    saveSession(next);
  }

  return (
    <div style={{ paddingTop: 18 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Drops</div>
          <div className="muted">Your session is saved \u2014 cart stays even if you refresh.</div>
        </div>
        <div className="pill">Cart items: {count}</div>
      </div>
      <div style={{ height: 12 }} />
      {isLoading && <div className="muted">Loading...</div>}
      {error && <div className="muted">Failed to load drops.</div>}
      <div className="grid cards">
        {(data ?? []).map((d) => (
          <div className="card compact" key={d.id}>
            {d.images?.[0] ? <img className="img compact" src={d.images[0]} alt={d.title} /> : <div className="img compact" />}
            <div className="p">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 800 }}>{d.title}</div>
                <div className="tag">{rupees(d.priceCents)}</div>
              </div>
              <div className="muted clamp2" style={{ marginTop: 6, fontSize: 13 }}>
                {d.description ?? "\u2014"}
              </div>
              <div style={{ height: 10 }} />
              <button className="btn primary" onClick={() => add(d)}>
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
      {(data ?? []).length === 0 && !isLoading && <div className="muted">No drops yet. Add from admin \u2192 Drops.</div>}
    </div>
  );
}