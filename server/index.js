import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { config } from "./config.js";
import { hasDatabase, initDatabase } from "./db.js";
import { providerName } from "./plants/service.js";
import plantsRouter from "./routes/plants.js";
import projectsRouter from "./routes/projects.js";
import suggestRouter from "./routes/suggest.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    database: hasDatabase(),
    plantSource: providerName,
    ai: config.anthropic.enabled,
  });
});

app.use("/api/plants", plantsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/suggest", suggestRouter);

app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint non trovato" }));

// In produzione lo stesso server serve anche il frontend compilato.
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Errore interno del server" : err.message });
});

try {
  await initDatabase();
} catch (err) {
  console.error("[db] Connessione a Postgres fallita, continuo senza database:", err.message);
}

app.listen(config.port, () => console.log(`[server] AiuolaLab API su http://localhost:${config.port}`));
