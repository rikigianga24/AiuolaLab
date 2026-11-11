import { createApp } from "./app.js";
import { config } from "./config.js";
import { initDatabase } from "./db.js";
import { startScheduler } from "./scheduler.js";
import { initPush } from "./notify.js";
import { CATALOG } from "./plants/catalog/index.js";
import { startPhotoWarmup } from "./plants/photos.js";
import { CROPS } from "../src/lib/crops.js";
import { initMonitoring, reportError } from "./monitor.js";
import { billingEnabled, checkPrices } from "./billing.js";

await initMonitoring();

try {
  await initDatabase();
} catch (err) {
  console.error("[db] Connessione a Postgres fallita, continuo senza database:", err.message);
  reportError(err, "avvio-database");
}

await initPush();

createApp().listen(config.port, () => console.log(`[server] AiuolaLab API su http://localhost:${config.port}`));
startScheduler();
// controllo (solo nel log) che i prezzi su Paddle siano quelli della pagina /prezzi
if (billingEnabled()) {
  console.log(`[pagamenti] Paddle attivo (ambiente: ${config.paddle.environment === "production" ? "pagamenti veri" : "prova"})`);
  checkPrices().catch((err) => console.warn("[pagamenti] controllo prezzi non riuscito:", err.message));
}
if (config.photoWarmup) startPhotoWarmup(() => [...CATALOG.map((p) => p.scientificName), ...CROPS.map((c) => c.scientificName)]);
