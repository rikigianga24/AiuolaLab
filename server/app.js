import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import express from "express";
import { sameOrigin, sessionMiddleware } from "./auth.js";
import { config } from "./config.js";
import { hasDatabase, query } from "./db.js";
import { reportError } from "./monitor.js";
import { mailEnabled, pushEnabled } from "./notify.js";
import { providerName } from "./plants/service.js";
import accountRouter from "./routes/account.js";
import authRouter from "./routes/auth.js";
import plantsRouter from "./routes/plants.js";
import projectsRouter from "./routes/projects.js";
import sharedRouter from "./routes/shared.js";
import { metaFor, renderIndex, robotsTxt, siteOrigin, sitemapXml } from "./seo.js";
import suggestRouter from "./routes/suggest.js";
import weatherRouter from "./routes/weather.js";
import contactRouter, { contactEnabled } from "./routes/contact.js";
import googleRouter, { googleEnabled } from "./routes/google.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  // File compressi (gzip): codice e grafica pesano circa un quarto.
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));

  // Intestazioni di sicurezza di base.
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    next();
  });

  app.use("/api", sameOrigin, sessionMiddleware);

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      database: hasDatabase(),
      plantSource: providerName,
      ai: config.gemini.enabled && hasDatabase(),
      accounts: hasDatabase(),
      mail: mailEnabled(),
      push: pushEnabled(),
      google: googleEnabled(),
      vapidPublicKey: pushEnabled() ? config.push.publicKey : null,
      contact: contactEnabled(),
      // registro degli errori e statistiche (spenti senza configurazione)
      sentryDsn: config.sentry.dsn,
      sentryEnvironment: config.sentry.environment,
      analytics: config.analytics,
    });
  });

  // Per i servizi di controllo (UptimeRobot e simili): 200 se il sito e il
  // database rispondono, 503 se il database configurato non risponde.
  app.get("/api/uptime", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!hasDatabase()) return res.json({ ok: true, database: "non configurato" });
    try {
      await Promise.race([
        query("SELECT 1"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000).unref()),
      ]);
      res.json({ ok: true, database: "ok" });
    } catch (err) {
      console.warn("[uptime] database non raggiungibile:", err.message);
      res.status(503).json({ ok: false, database: "non raggiungibile" });
    }
  });

  app.use("/api/auth/google", googleRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/plants", plantsRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/shared", sharedRouter);
  app.use("/api/suggest", suggestRouter);
  app.use("/api/weather", weatherRouter);
  app.use("/api/contact", contactRouter);

  app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint non trovato" }));

  // Per Google: elenco delle pagine e regole per i motori di ricerca.
  app.get("/sitemap.xml", (req, res) => res.type("application/xml").send(sitemapXml(siteOrigin(req))));
  app.get("/robots.txt", (req, res) => res.type("text/plain").send(robotsTxt(siteOrigin(req))));

  // In produzione lo stesso server serve anche il frontend compilato.
  const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  if (fs.existsSync(distDir)) {
    const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
    app.use(express.static(distDir, { index: false, maxAge: "1h" }));
    // ogni pagina riceve titolo, descrizione e anteprima giusti già nell'HTML
    app.get(/^(?!\/api\/).*/, async (req, res, next) => {
      try {
        const meta = await metaFor(req.path);
        res.set("Cache-Control", "no-cache");
        res.type("html").send(renderIndex(indexHtml, meta, { origin: siteOrigin(req), pathname: req.path }));
      } catch (err) {
        next(err);
      }
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status >= 500) {
      console.error(err);
      reportError(err, "api");
    }
    res.status(status).json({ error: status === 500 ? "Errore interno del server" : err.message });
  });

  return app;
}
