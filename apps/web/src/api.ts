export type DropDesign = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string | null;
  images: string[];
  availableSizes?: string[];
  isActive: boolean;
  updatedAt?: string;
  createdAt: string;
};

export type CustomRequest = {
  id: string;
  accessToken?: string;
  customerName: string;
  phone: string;
  notes: string | null;
  referenceImages: string[];
  status: string;
  approxPriceLow: number;
  approxPriceHigh: number;
  quotedPriceCents: number | null;
  createdAt: string;
  designs?: { id: string; images: string[]; notes: string | null; createdAt: string }[];
};

export type Order = {
  id: string;
  orderNumber: string;
  accessToken: string;
  orderType: "DROP" | "CUSTOM" | "BULK";
  status: string;
  paymentMethod: "COD";
  customerName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  totalCents: number;
  createdAt: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPriceCents: number;
    variant: string | null;
    size: string | null;
    imageUrl: string | null;
  }>;
  events?: Array<{ id: string; type: string; message: string | null; createdAt: string }>;
};

export type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
};

async function json<T = any>(res: Response): Promise<T> {
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = data?.error ? JSON.stringify(data.error) : raw || `Request failed (${res.status})`;
    throw new Error(err);
  }
  return data as T;
}

export const api = {
  drops: async (): Promise<DropDesign[]> => {
    const r = await fetch("/api/drops");
    const d = await json<{ drops: DropDesign[] }>(r);
    return d.drops;
  },
  drop: async (id: string): Promise<DropDesign> => {
    const r = await fetch(`/api/drops/${encodeURIComponent(id)}`);
    const d = await json<{ drop: DropDesign }>(r);
    return d.drop;
  },
    getCustomRequestByToken: async (token: string): Promise<CustomRequest> => {
    const r = await fetch(`/api/custom-requests/by-token/${encodeURIComponent(token)}`);
    const d = await json<{ customRequest: CustomRequest }>(r);
    return d.customRequest;
  },
  updateCustomRequestByToken: async (token: string, payload: { referenceImages?: string[]; notes?: string }): Promise<CustomRequest> => {
    const r = await fetch(`/api/custom-requests/by-token/${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const d = await json<{ customRequest: CustomRequest }>(r);
    return d.customRequest;
  },createCustomRequest: async (payload: { customerName: string; phone: string; notes?: string; referenceImages: string[] }) => {
    const r = await fetch("/api/custom-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return json<{ customRequest: CustomRequest }>(r);
  },
  createOrder: async (payload: any): Promise<{ order: Order }> => {
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return json(r);
  },
  getOrderByToken: async (token: string): Promise<Order> => {
    const r = await fetch(`/api/orders/by-token/${encodeURIComponent(token)}`);
    const d = await json<{ order: Order }>(r);
    return d.order;
  },
  customer: {
    startLogin: async (phone: string): Promise<{ ok: true; code?: string }> => {
      const r = await fetch("/api/customer/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone })
      });
      return json(r);
    },
    verifyLogin: async (phone: string, code: string): Promise<{ ok: true }> => {
      const r = await fetch("/api/customer/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, code })
      });
      return json(r);
    },
    me: async (): Promise<{ phoneDigits: string }> => {
      const r = await fetch("/api/customer/me", { credentials: "include" });
      return json(r);
    },
    logout: async (): Promise<{ ok: true }> => {
      const r = await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
      return json(r);
    },
    orders: async (): Promise<{ orders: Order[] }> => {
      const r = await fetch("/api/customer/orders", { credentials: "include" });
      return json(r);
    }
  },
  imagekit: {
    publicAuth: async (): Promise<ImageKitAuth> => {
      const r = await fetch("/api/public/imagekit/auth", { method: "POST" });
      return json<ImageKitAuth>(r);
    },
    adminAuth: async (): Promise<ImageKitAuth> => {
      const r = await fetch("/api/admin/imagekit/auth", { method: "POST", credentials: "include" });
      return json<ImageKitAuth>(r);
    }
  },
  admin: {
    login: async (passcode: string) => {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passcode })
      });
      return json<{ ok: true }>(r);
    },
    logout: async () => {
      const r = await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      return json<{ ok: true }>(r);
    },
    me: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      return json<{ role: "admin" }>(r);
    },
    drops: async (): Promise<DropDesign[]> => {
      const r = await fetch("/api/admin/drops", { credentials: "include" });
      const d = await json<{ drops: DropDesign[] }>(r);
      return d.drops;
    },
    createDrop: async (payload: Partial<DropDesign>) => {
      const r = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      return json(r);
    },
    updateDrop: async (id: string, payload: Partial<DropDesign>) => {
      const r = await fetch(`/api/admin/drops/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        }
      );
      return json(r);
    },
    deleteDrop: async (id: string) => {
      const r = await fetch(`/api/admin/drops/${id}`, { method: "DELETE", credentials: "include" });
      return json(r);
    },
    customRequests: async (): Promise<CustomRequest[]> => {
      const r = await fetch("/api/admin/custom-requests", { credentials: "include" });
      const d = await json<{ customRequests: CustomRequest[] }>(r);
      return d.customRequests;
    },
    updateCustomRequest: async (id: string, payload: any) => {
      const r = await fetch(`/api/admin/custom-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      return json(r);
    },
    addCustomDesign: async (id: string, payload: any) => {
      const r = await fetch(`/api/admin/custom-requests/${id}/designs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      return json(r);
    },
    orders: async () => {
      const r = await fetch("/api/admin/orders", { credentials: "include" });
      return json(r);
    },
    order: async (id: string) => {
      const r = await fetch(`/api/admin/orders/${id}`, { credentials: "include" });
      return json(r);
    },
    acceptOrder: async (id: string, note?: string) => {
      const r = await fetch(`/api/admin/orders/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(note ? { note } : {})
      });
      return json(r);
    },
    requestPartial: async (id: string, amountCents: number, note?: string) => {
      const r = await fetch(`/api/admin/orders/${id}/request-partial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(note ? { amountCents, note } : { amountCents })
      });
      return json(r);
    },
    markPartialPaid: async (id: string, note?: string) => {
      const r = await fetch(`/api/admin/orders/${id}/mark-partial-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(note ? { note } : {})
      });
      return json(r);
    },
    markShipped: async (id: string, note?: string) => {
      const r = await fetch(`/api/admin/orders/${id}/mark-shipped`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(note ? { note } : {})
      });
      return json(r);
    },
    markDelivered: async (id: string, note?: string) => {
      const r = await fetch(`/api/admin/orders/${id}/mark-delivered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(note ? { note } : {})
      });
      return json(r);
    },
    cancelOrder: async (id: string, reason: string) => {
      const r = await fetch(`/api/admin/orders/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason })
      });
      return json(r);
    }
  }
};


