import { z } from "zod";

export const moneyCents = z.number().int().nonnegative();

const phoneRawSchema = z.string().min(6).max(24);

export function normalizePhoneDigits(input: string) {
  return input.replace(/[^0-9]/g, "").slice(0, 15);
}

export const orderItemSchema = z.object({
  title: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPriceCents: moneyCents,
  variant: z.string().optional(),
  size: z.string().optional(),
  imageUrl: z.string().url().optional(),
  dropDesignId: z.string().uuid().optional(),
  customRequestId: z.string().uuid().optional()
});

export const createOrderSchema = z.object({
  orderType: z.enum(["DROP", "CUSTOM", "BULK"]),
  customer: z.object({
    name: z.string().min(1),
    phone: phoneRawSchema,
    email: z.string().email().optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4)
  }),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional()
});

export const createCustomRequestSchema = z.object({
  customerName: z.string().min(1),
  phone: phoneRawSchema,
  notes: z.string().optional(),
  referenceImages: z.array(z.string().url()).default([])
});

export const adminLoginSchema = z.object({
  passcode: z.string().min(1)
});

export const adminUpsertDropSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: moneyCents,
  category: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().optional()
});

export const adminUpdateCustomRequestSchema = z.object({
  status: z.enum(["REQUESTED", "IN_PROGRESS", "QUOTED", "ACCEPTED", "DECLINED", "COMPLETED"]).optional(),
  quotedPriceCents: moneyCents.optional(),
  notes: z.string().optional()
});

export const adminAddCustomDesignSchema = z.object({
  images: z.array(z.string().url()).min(1),
  notes: z.string().optional()
});

export const adminOrderNoteSchema = z.object({
  note: z.string().max(500).optional()
});

export const adminRequestPartialSchema = z.object({
  amountCents: moneyCents,
  note: z.string().max(500).optional()
});

export const adminCancelOrderSchema = z.object({
  reason: z.string().min(1).max(500)
});

export const customerLoginStartSchema = z.object({
  phone: phoneRawSchema
});

export const customerLoginVerifySchema = z.object({
  phone: phoneRawSchema,
  code: z.string().min(4).max(12)
});

export const publicUpdateCustomRequestSchema = z.object({
  referenceImages: z.array(z.string().url()).optional(),
  notes: z.string().optional()
});
