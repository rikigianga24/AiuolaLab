import { Router } from "express";
import { ZodError } from "zod";
import { suggestBed } from "../ai/advisor.js";
import { config } from "../config.js";

const router = Router();

// Limite semplice per IP: ogni richiesta all'IA ha un costo.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => t > windowStart);
  if (list.length >= config.suggestRateLimitPerHour) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

router.post("/", async (req, res, next) => {
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: "Troppe richieste al consulente IA, riprova più tardi." });
  }
  try {
    res.json(await suggestBed(req.body));
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "Dati dell'aiuola non validi" });
    next(err);
  }
});

export default router;
