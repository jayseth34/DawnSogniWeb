import { useEffect, useMemo, useState } from "react";
import { loadSession, saveSession, type CartItem, type SessionState } from "../storage";
import type { DropDesign } from "../api";

export type SessionApi = {
  session: SessionState;
  persist: (next: SessionState) => void;
  cartCount: number;
  addDropToCart: (drop: DropDesign, opts?: { quantity?: number }) => void;
  addBulkToCart: (item: Omit<CartItem, "kind"> & { kind?: "BULK" }) => void;
  removeCartItem: (index: number) => void;
  updateCartQty: (index: number, nextQty: number) => void;
};

export function useSessionApi(): SessionApi {
  const [session, setSession] = useState<SessionState>(() => loadSession());

  function persist(next: SessionState) {
    setSession(next);
    saveSession(next);
  }

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key !== "dawnsogni.session.v1") return;
      setSession(loadSession());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const cartCount = useMemo(() => session.cart.reduce((s, i) => s + (Number.isFinite(i.quantity) ? i.quantity : 0), 0), [session.cart]);

  function addDropToCart(drop: DropDesign, opts?: { quantity?: number }) {
    const quantity = Math.max(1, Math.floor(opts?.quantity ?? 1));
    const existing = session.cart.find((c) => c.kind === "DROP" && c.dropDesignId === drop.id);

    let nextCart: CartItem[];
    if (existing) {
      nextCart = session.cart.map((c) =>
        c.kind === "DROP" && c.dropDesignId === drop.id ? { ...c, quantity: c.quantity + quantity } : c
      );
    } else {
      nextCart = [
        ...session.cart,
        {
          kind: "DROP",
          dropDesignId: drop.id,
          title: drop.title,
          unitPriceCents: drop.priceCents,
          quantity,
          imageUrl: drop.images?.[0]
        }
      ];
    }

    persist({ ...session, cart: nextCart });
  }

  function addBulkToCart(item: Omit<CartItem, "kind"> & { kind?: "BULK" }) {
    const q = Math.max(1, Math.floor(Number(item.quantity) || 1));
    persist({
      ...session,
      cart: [
        ...session.cart,
        {
          kind: "BULK",
          title: item.title,
          unitPriceCents: Number.isFinite(item.unitPriceCents) ? item.unitPriceCents : 0,
          quantity: q,
          variant: item.variant,
          size: item.size,
          imageUrl: item.imageUrl
        }
      ]
    });
  }

  function removeCartItem(index: number) {
    persist({ ...session, cart: session.cart.filter((_, i) => i !== index) });
  }

  function updateCartQty(index: number, nextQty: number) {
    const q = Math.max(1, Math.floor(Number(nextQty) || 1));
    persist({
      ...session,
      cart: session.cart.map((c, i) => (i === index ? { ...c, quantity: q } : c))
    });
  }

  return {
    session,
    persist,
    cartCount,
    addDropToCart,
    addBulkToCart,
    removeCartItem,
    updateCartQty
  };
}
