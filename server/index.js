import { createApp } from "./app.js";
import { config } from "./config.js";
import { initDatabase } from "./db.js";
import { startScheduler } from "./scheduler.js";
import { initPush } from "./notify.js";
import { CATALOG } from "./plants/catalog/index.js";
import { startPhotoWarmup } from "./plants/photos.js";
import { CROPS } from "../src/lib/crops.js";

try {
  await initDatabase();
} catch (err) {
  console.error("[db] Connessione a Postgres fallita, continuo senza database:", err.message);
}

await initPush();

createApp().listen(config.port, () => console.log(`[server] AiuolaLab API su http://localhost:${config.port}`));
startScheduler();
if (config.photoWarmup) startPhotoWarmup(() => [...CATALOG.map((p) => p.scientificName), ...CROPS.map((c) => c.scientificName)]);
