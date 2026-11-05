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
  pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
  const schema = await fs.readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(schema);
  console.log("[db] Connesso a Postgres, schema aggiornato.");
}

export function query(text, params) {
  if (!pool) throw new Error("Database non configurato");
  return pool.query(text, params);
}
