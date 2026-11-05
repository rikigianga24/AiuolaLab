import fs from "node:fs/promises";
import pg from "pg";
import { config } from "./config.js";

let pool = null;

export function hasDatabase() {
  return pool !== null;
}

export async function initDatabase() {
  if (!config.databaseUrl) {
    console.log("[db] DATABASE_URL non impostato: progetti solo nel browser, cache in memoria.");
    return;
  }
  const candidate = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
  const schema = await fs.readFile(new URL("./schema.sql", import.meta.url), "utf8");
  try {
    await candidate.query(schema);
  } catch (err) {
    await candidate.end().catch(() => {});
    throw err;
  }
  pool = candidate;
  console.log("[db] Connesso a Postgres, schema aggiornato.");
}

export function query(text, params) {
  if (!pool) throw new Error("Database non configurato");
  return pool.query(text, params);
}
