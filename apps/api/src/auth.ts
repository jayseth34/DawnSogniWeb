import jwt from "jsonwebtoken";
import { env } from "./env.js";
import type { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "ds_admin";

function shouldUseSecureCookies() {
  // If you run the app on http://localhost with NODE_ENV=production, a `secure` cookie will not be set.
  // Tie `secure` to the site URL scheme instead.
  return env.WEB_ORIGIN.toLowerCase().startsWith("https://");
}

export function setAdminCookie(res: Response) {
  const token = jwt.sign({ role: "admin" }, env.ADMIN_JWT_SECRET, {
    expiresIn: "14d"
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    maxAge: 14 * 24 * 60 * 60 * 1000
  });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as { role?: string };
    if (payload.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}
