import { Router } from "express";
import { z } from "zod";
import { getPlantPhotos } from "../plants/photos.js";
import { STYLE_IDS } from "../../src/lib/gardenStyles.js";
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
  group: z.enum(["rose", "perenni", "annuali", "bulbose", "arbusti", "rampicanti", "graminacee", "aromatiche", "balcone"]).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  style: z.enum(STYLE_IDS).optional(),
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

// Foto da iNaturalist: /api/plants/photos?name=Lavandula%20angustifolia[&full=1]
const PhotoQuery = z.object({ name: z.string().trim().min(2).max(120), full: z.enum(["0", "1"]).optional() });

router.get("/photos", async (req, res) => {
  const parsed = PhotoQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Nome non valido" });
  try {
    const data = await getPlantPhotos(parsed.data.name, { full: parsed.data.full === "1" });
    res.set("Cache-Control", "public, max-age=86400");
    res.json(data);
  } catch (err) {
    console.warn("[photos]", err.message);
    res.status(502).json({ error: "Foto non disponibili al momento", photos: [] });
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
