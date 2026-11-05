import { Router } from "express";
import { z } from "zod";
import { getPlant, providerName, searchPlants } from "../plants/service.js";

const router = Router();

const SearchQuery = z.object({
  q: z.string().trim().max(80).optional(),
  sunlight: z.enum(["full_sun", "part_shade", "full_shade"]).optional(),
  watering: z.enum(["minimum", "average", "frequent"]).optional(),
  cycle: z.enum(["perennial", "annual", "biennial"]).optional(),
  ph: z.enum(["acid", "neutral", "alkaline"]).optional(),
  texture: z.enum(["sandy", "loamy", "clay", "chalky"]).optional(),
  color: z.string().max(20).optional(),
  season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
});

router.get("/", async (req, res, next) => {
  const parsed = SearchQuery.safeParse(
    Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== "")),
  );
  if (!parsed.success) return res.status(400).json({ error: "Filtri non validi" });
  try {
    res.json({ source: providerName, ...(await searchPlants(parsed.data)) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const plant = await getPlant(req.params.id);
    if (!plant) return res.status(404).json({ error: "Pianta non trovata" });
    res.json(plant);
  } catch (err) {
    next(err);
  }
});

export default router;
