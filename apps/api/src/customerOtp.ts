import { createHmac, randomInt } from "node:crypto";
import { env } from "./env.js";

type DbClient = {
  query: (text: string, params?: any[]) => Promise<any>;
};

export function normalizePhoneDigits(input: string) {
  return input.replace(/[^0-9]/g, "").slice(0, 15);
}

export function generateOtpCode() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

export function hashOtp(phoneDigits: string, code: string) {
  return createHmac("sha256", env.CUSTOMER_JWT_SECRET).update(`${phoneDigits}:${code}`).digest("hex");
}

export async function canIssueOtp(client: DbClient, phoneDigits: string) {
  const r = await client.query(
    `select count(*)::int as c
     from customer_phone_otps
     where phone_digits=$1 and created_at > (now() - interval '1 hour')`,
    [phoneDigits]
  );
  return (r.rows[0]?.c ?? 0) < 5;
}

export async function createOtp(client: DbClient, phoneDigits: string, codeHash: string) {
  const r = await client.query(
    `insert into customer_phone_otps (phone_digits, code_hash, expires_at)
     values ($1,$2, now() + interval '10 minutes')
     returning id, expires_at as "expiresAt"`,
    [phoneDigits, codeHash]
  );
  return r.rows[0] as { id: string; expiresAt: string };
}

export async function findActiveOtp(client: DbClient, phoneDigits: string) {
  const r = await client.query(
    `select id, code_hash as "codeHash", attempts, expires_at as "expiresAt"
     from customer_phone_otps
     where phone_digits=$1 and consumed_at is null and expires_at > now()
     order by created_at desc
     limit 1`,
    [phoneDigits]
  );
  return (r.rows[0] ?? null) as null | { id: string; codeHash: string; attempts: number; expiresAt: string };
}

export async function incrementOtpAttempt(client: DbClient, id: string) {
  await client.query(`update customer_phone_otps set attempts = attempts + 1 where id=$1`, [id]);
}

export async function consumeOtp(client: DbClient, id: string) {
  await client.query(`update customer_phone_otps set consumed_at = now() where id=$1`, [id]);
}
