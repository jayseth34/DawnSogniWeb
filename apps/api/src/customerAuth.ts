import jwt from "jsonwebtoken";
import { env } from "./env.js";
import type { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "ds_customer";

export function setCustomerCookie(res: Response, phoneDigits: string) {
  const token = jwt.sign({ phone: phoneDigits }, env.CUSTOMER_JWT_SECRET, {
    expiresIn: "30d"
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearCustomerCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, env.CUSTOMER_JWT_SECRET) as { phone?: string };
    if (!payload.phone) return res.status(401).json({ error: "Invalid session" });
    (req as any).customerPhone = String(payload.phone);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}
