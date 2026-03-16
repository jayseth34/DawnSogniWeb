export type DropDesign = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
};

export type CustomRequest = {
  id: string;
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

async function json<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T;
  if (!res.ok) throw new Error((data as any)?.error ? JSON.stringify((data as any).error) : "Request failed");
  return data;
}

export const api = {
  drops: async (): Promise<DropDesign[]> => {
    const r = await fetch("/api/drops");
    const d = await json<{ drops: DropDesign[] }>(r);
    return d.drops;
  },
  createCustomRequest: async (payload: { customerName: string; phone: string; notes?: string; referenceImages: string[] }) => {
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
    acceptOrder: async (id: string) => {
      const r = await fetch(`/api/admin/orders/${id}/accept`, { method: "POST", credentials: "include" });
      return json(r);
    },
    requestPartial: async (id: string, amountCents: number) => {
      const r = await fetch(`/api/admin/orders/${id}/request-partial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountCents })
      });
      return json(r);
    },
    markPartialPaid: async (id: string) => {
      const r = await fetch(`/api/admin/orders/${id}/mark-partial-paid`, { method: "POST", credentials: "include" });
      return json(r);
    },
    markShipped: async (id: string) => {
      const r = await fetch(`/api/admin/orders/${id}/mark-shipped`, { method: "POST", credentials: "include" });
      return json(r);
    },
    markDelivered: async (id: string) => {
      const r = await fetch(`/api/admin/orders/${id}/mark-delivered`, { method: "POST", credentials: "include" });
      return json(r);
    }
  }
};
