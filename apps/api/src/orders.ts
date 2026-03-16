import { nanoid } from "nanoid";
import type pg from "pg";

export function createOrderNumber() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const suffix = nanoid(6).toUpperCase();
  return `DS-${yyyy}${mm}${dd}-${suffix}`;
}

export function createAccessToken() {
  return nanoid(32);
}

export async function addOrderEvent(client: pg.PoolClient, params: { orderId: string; type: string; message?: string }) {
  await client.query(
    "insert into order_events (order_id, type, message) values ($1, $2, $3)",
    [params.orderId, params.type, params.message ?? null]
  );
}
