import { createApp } from "./app.js";
import { config } from "./config.js";
import { initDatabase } from "./db.js";
import { startScheduler } from "./scheduler.js";

try {
  await initDatabase();
} catch (err) {
  console.error("[db] Connessione a Postgres fallita, continuo senza database:", err.message);
}

createApp().listen(config.port, () => console.log(`[server] AiuolaLab API su http://localhost:${config.port}`));
startScheduler();
