const KEY = "dawnsogni.session.v1";

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

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { cart: [], orderTokens: [] };
    const parsed = JSON.parse(raw) as SessionState;
    return {
      customerDraft: parsed.customerDraft,
      cart: parsed.cart ?? [],
      orderTokens: parsed.orderTokens ?? []
    };
  } catch {
    return { cart: [], orderTokens: [] };
  }
}

export function saveSession(next: SessionState) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

