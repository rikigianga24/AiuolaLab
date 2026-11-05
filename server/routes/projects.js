// Progetti salvati su Postgres. Ogni dispositivo ha una chiave anonima
// (X-Owner-Key) generata dal browser: chi la possiede vede i suoi progetti.
// Quando arriverà il login, owner_key diventerà l'id utente.
import { Router } from "express";
import { z } from "zod";
import { hasDatabase, query } from "../db.js";

const router = Router();

const OwnerKey = z.string().uuid();
const ProjectBody = z.object({
  name: z.string().trim().min(1).max(120),
  data: z.object({ beds: z.array(z.any()).max(200) }).passthrough(),
});
const Id = z.string().uuid();

router.use((req, res, next) => {
  if (!hasDatabase()) return res.status(503).json({ error: "Database non configurato" });
  const owner = OwnerKey.safeParse(req.get("X-Owner-Key"));
  if (!owner.success) return res.status(401).json({ error: "Chiave proprietario mancante" });
  req.owner = owner.data;
  next();
});

const toDto = (row) => ({
  id: row.id,
  name: row.name,
  data: row.data,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, name, created_at, updated_at FROM projects WHERE owner_key = $1 ORDER BY updated_at DESC LIMIT 100",
      [req.owner],
    );
    res.json(rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, updatedAt: r.updated_at })));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!Id.safeParse(req.params.id).success) return res.status(404).json({ error: "Progetto non trovato" });
  try {
    const { rows } = await query("SELECT * FROM projects WHERE id = $1 AND owner_key = $2", [req.params.id, req.owner]);
    if (!rows[0]) return res.status(404).json({ error: "Progetto non trovato" });
    res.json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const body = ProjectBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Progetto non valido" });
  try {
    const { rows } = await query(
      "INSERT INTO projects (owner_key, name, data) VALUES ($1, $2, $3) RETURNING *",
      [req.owner, body.data.name, JSON.stringify(body.data.data)],
    );
    res.status(201).json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  const body = ProjectBody.safeParse(req.body);
  if (!body.success || !Id.safeParse(req.params.id).success) return res.status(400).json({ error: "Progetto non valido" });
  try {
    const { rows } = await query(
      `UPDATE projects SET name = $3, data = $4, updated_at = now()
       WHERE id = $1 AND owner_key = $2 RETURNING *`,
      [req.params.id, req.owner, body.data.name, JSON.stringify(body.data.data)],
    );
    if (!rows[0]) return res.status(404).json({ error: "Progetto non trovato" });
    res.json(toDto(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!Id.safeParse(req.params.id).success) return res.status(404).json({ error: "Progetto non trovato" });
  try {
    const { rowCount } = await query("DELETE FROM projects WHERE id = $1 AND owner_key = $2", [req.params.id, req.owner]);
    if (!rowCount) return res.status(404).json({ error: "Progetto non trovato" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
