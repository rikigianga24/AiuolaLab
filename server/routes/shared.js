// Progetti condivisi con un link: chiunque abbia il token li vede in sola
// lettura. Non servono né account né chiave del dispositivo.
import { Router } from "express";
import { z } from "zod";
import { hasDatabase, query } from "../db.js";

const router = Router();
export const ShareToken = z.string().regex(/^[A-Za-z0-9_-]{16}$/);

// Solo i dati che servono a disegnare il progetto.
const publicData = (data) => ({
  type: data?.type ?? "garden",
  beds: Array.isArray(data?.beds) ? data.beds : [],
  faucet: data?.faucet ?? null,
  irrigation: data?.irrigation ?? null,
});

export async function findShared(token) {
  if (!hasDatabase() || !ShareToken.safeParse(token).success) return null;
  const { rows } = await query("SELECT name, data, updated_at FROM projects WHERE share_token = $1", [token]);
  return rows[0] ?? null;
}

router.get("/:token", async (req, res, next) => {
  if (!hasDatabase()) return res.status(503).json({ error: "Database non configurato" });
  try {
    const row = await findShared(req.params.token);
    if (!row) return res.status(404).json({ error: "Link non valido o non più condiviso" });
    res.set("Cache-Control", "no-store");
    res.json({ name: row.name, updatedAt: row.updated_at, data: publicData(row.data) });
  } catch (err) {
    next(err);
  }
});

export default router;
