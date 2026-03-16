const KEY = "dawnsogni.session.v1";

export function sessionKeyForPhone(phoneDigits?: string | null) {
  const p = String(phoneDigits || "").trim();
  if (!p) return KEY;
  return `${KEY}.phone.${p}`;
}

export const PENDING_SESSION_KEY = `${KEY}.pending`;

export type CustomerDraft = {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type CartItem = {
  kind: "DROP" | "BULK";
  dropDesignId?: string;
  title: string;
  unitPriceCents: number;
  quantity: number;
  variant?: string;
  size?: string;
  imageUrl?: string;
};

export type SessionState = {
  customerDraft?: CustomerDraft;
  cart: CartItem[];
  orderTokens: string[];
};

function empty(): SessionState {
  return { cart: [], orderTokens: [] };
}

export function loadSession(key: string = KEY): SessionState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as SessionState;
    return {
      customerDraft: parsed.customerDraft,
      cart: parsed.cart ?? [],
      orderTokens: parsed.orderTokens ?? []
    };
  } catch {
    return empty();
  }
}

export function saveSession(next: SessionState, key: string = KEY) {
  localStorage.setItem(key, JSON.stringify(next));
}
