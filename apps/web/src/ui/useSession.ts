import { useEffect, useMemo, useState } from "react";
import { loadSession, saveSession, PENDING_SESSION_KEY, sessionKeyForPhone, type CartItem, type SessionState } from "../storage";
import type { DropDesign } from "../api";
import { useCustomerAuth } from "./useCustomerAuth";

export type SessionApi = {
  session: SessionState;
  persist: (next: SessionState) => void;
  cartCount: number;
  canShop: boolean;
  requireLogin: () => void;
  addDropToCart: (drop: DropDesign, opts?: { quantity?: number }) => void;
  addBulkToCart: (item: Omit<CartItem, "kind"> & { kind?: "BULK" }) => void;
  removeCartItem: (index: number) => void;
  updateCartQty: (index: number, nextQty: number) => void;
};

export function useSessionApi(): SessionApi {
  const { status, phoneDigits } = useCustomerAuth();

  const storageKey = useMemo(() => {
    if (status === "loading") return PENDING_SESSION_KEY;
    if (status === "authed") return sessionKeyForPhone(phoneDigits);
    return sessionKeyForPhone("");
  }, [status, phoneDigits]);

  const [session, setSession] = useState<SessionState>(() => loadSession(storageKey));

  useEffect(() => {
    setSession(loadSession(storageKey));
  }, [storageKey]);

  function persist(next: SessionState) {
    setSession(next);
    saveSession(next, storageKey);
  }

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key !== storageKey) return;
      setSession(loadSession(storageKey));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const cartCount = useMemo(
    () => session.cart.reduce((s, i) => s + (Number.isFinite(i.quantity) ? i.quantity : 0), 0),
    [session.cart]
  );

  function requireLogin() {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }

  function addDropToCart(drop: DropDesign, opts?: { quantity?: number }) {
    if (status !== "authed") return requireLogin();

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
    if (status !== "authed") return requireLogin();

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
    if (status !== "authed") return requireLogin();
    persist({ ...session, cart: session.cart.filter((_, i) => i !== index) });
  }

  function updateCartQty(index: number, nextQty: number) {
    if (status !== "authed") return requireLogin();
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
    canShop: status === "authed",
    requireLogin,
    addDropToCart,
    addBulkToCart,
    removeCartItem,
    updateCartQty
  };
}
