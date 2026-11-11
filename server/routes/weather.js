// Meteo (MET Norway, licenza CC BY 4.0) e ricerca località (OpenStreetMap
// Nominatim). Le richieste partono dal server: il browser dell'utente non
// contatta servizi esterni e le risposte vengono messe in cache.
import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "../auth.js";
import { config } from "../config.js";
import { dailySummary, weatherAlerts } from "../../src/lib/weather.js";

const router = Router();

const userAgent = () =>
  `AiuolaLab/0.3 (${config.appUrl}${config.weatherContact ? `; ${config.weatherContact}` : ""})`;

const forecastCache = new Map(); // "lat,lon" -> { expires, lastModified, data }
const geoCache = new Map();
// Nominatim chiede al massimo 1 richiesta al secondo per tutta l'app:
// le richieste passano in fila una alla volta.
let geocodeQueue = Promise.resolve();
const geocodeTurn = () => {
  const turn = geocodeQueue.then(() => new Promise((r) => setTimeout(r, 1100)));
  const mine = geocodeQueue;
  geocodeQueue = turn;
  return mine;
};
// per IP: basta a chi cerca il proprio comune, ferma chi la usa a raffica
const geocodeLimiter = rateLimit({ max: 30, windowMs: 10 * 60 * 1000 });

export async function getForecast(lat, lon) {
  // MET chiede massimo 4 decimali; 2 bastano (circa 1 km) e migliorano la cache
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = forecastCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
  const headers = { "User-Agent": userAgent(), Accept: "application/json" };
  if (cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;
  const res = await fetch(url, { headers });
  if (res.status === 304 && cached) {
    cached.expires = Date.parse(res.headers.get("expires") ?? "") || Date.now() + 30 * 60 * 1000;
    return cached.data;
  }
  if (!res.ok) {
    const err = new Error(`Servizio meteo non disponibile (${res.status})`);
    err.status = 502;
    throw err;
  }
  const json = await res.json();
  const data = {
    updatedAt: json.properties?.meta?.updated_at ?? null,
    days: dailySummary(json.properties?.timeseries ?? []),
  };
  if (forecastCache.size > 5000) forecastCache.delete(forecastCache.keys().next().value);
  forecastCache.set(key, {
    data,
    lastModified: res.headers.get("last-modified"),
    expires: Date.parse(res.headers.get("expires") ?? "") || Date.now() + 30 * 60 * 1000,
  });
  return data;
}

const Coords = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  pots: z.enum(["0", "1"]).optional(),
  vegetable: z.enum(["0", "1"]).optional(),
  irrigation: z.enum(["0", "1"]).optional(),
});

router.get("/", async (req, res, next) => {
  const q = Coords.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: "Coordinate non valide" });
  try {
    const forecast = await getForecast(q.data.lat, q.data.lon);
    const context = { pots: q.data.pots === "1", vegetable: q.data.vegetable === "1", irrigation: q.data.irrigation === "1" };
    res.json({
      ...forecast,
      alerts: weatherAlerts(forecast.days, context),
      attribution: "Dati meteo: MET Norway (CC BY 4.0)",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/geocode", geocodeLimiter, async (req, res, next) => {
  const q = z.string().trim().min(2).max(100).safeParse(req.query.q);
  if (!q.success) return res.status(400).json({ error: "Scrivi il nome di un comune" });
  const key = q.data.toLowerCase();
  if (geoCache.has(key)) return res.json(geoCache.get(key));
  try {
    await geocodeTurn();
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=it&countrycodes=it,sm,va,ch&q=${encodeURIComponent(q.data)}`;
    const r = await fetch(url, { headers: { "User-Agent": userAgent() } });
    if (!r.ok) return res.status(502).json({ error: "Ricerca località non disponibile" });
    const items = (await r.json()).map((p) => ({
      name: p.display_name.split(",").slice(0, 3).join(","),
      lat: Number(p.lat),
      lon: Number(p.lon),
    }));
    const result = { items, attribution: "© OpenStreetMap contributors" };
    if (geoCache.size > 2000) geoCache.delete(geoCache.keys().next().value);
    geoCache.set(key, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
