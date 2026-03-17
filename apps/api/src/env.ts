import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer repo-root .env so `npm run dev` works from the monorepo root.
const rootEnvPath = path.resolve(__dirname, "../../../.env");
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

function toBool(v: unknown, fallback: boolean) {
  if (typeof v !== "string") return fallback;
  const s = v.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return fallback;
}

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),

  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z.string().optional().default("false"),

  DATABASE_URL: z.string().optional().default(""),

  WEB_ORIGIN: z.string().url(),
  ADMIN_PASSCODE: z.string().min(1),
  ADMIN_JWT_SECRET: z.string().min(10),

  CUSTOMER_JWT_SECRET: z.string().min(10),

  IMAGEKIT_PUBLIC_KEY: z.string().optional().default(""),
  IMAGEKIT_PRIVATE_KEY: z.string().optional().default(""),
  IMAGEKIT_URL_ENDPOINT: z.string().optional().default(""),

  OWNER_NOTIFY_TO: z.string().optional().default("")
});

const raw = envSchema.parse(process.env);

export const env = {
  ...raw,
  DB_SSL: toBool(raw.DB_SSL, false),
  DATABASE_URL:
    raw.DATABASE_URL && raw.DATABASE_URL.length > 0
      ? raw.DATABASE_URL
      : `postgresql://${encodeURIComponent(raw.DB_USER)}:${encodeURIComponent(raw.DB_PASSWORD)}@${raw.DB_HOST}:${raw.DB_PORT}/${raw.DB_NAME}`
};
