import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import purgecss from "@fullhuman/postcss-purgecss";

// Bulma e Font Awesome contengono migliaia di classi e icone: nella versione
// pubblicata teniamo solo quelle che compaiono davvero nel codice dell'app.
// Gli stili scritti da noi non vengono toccati.
const LIBRERIE_DA_SFOLTIRE = ["/node_modules/bulma/", "/node_modules/@fortawesome/"];

function sfoltisciLibrerie() {
  const purge = purgecss({
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    // classi composte nel codice (es. `is-${kind}`), che la ricerca non vede intere
    safelist: {
      standard: [/^is-(primary|link|info|success|warning|danger|light|dark|white|black|small|medium|large|active)$/],
      greedy: [/^fa-(solid|regular|brands)$/],
    },
  });
  return {
    postcssPlugin: "sfoltisci-librerie",
    OnceExit(root, helpers) {
      const file = (root.source?.input.file ?? "").replaceAll("\\", "/");
      if (!LIBRERIE_DA_SFOLTIRE.some((dir) => file.includes(dir))) return;
      return purge.OnceExit(root, helpers);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  css: {
    postcss: { plugins: command === "build" ? [sfoltisciLibrerie()] : [] },
  },
  plugins: [
    react(),
    // App installabile su telefono e desktop (PWA).
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "AiuolaLab — progetta le tue aiuole",
        short_name: "AiuolaLab",
        description: "Disegna aiuole in scala, scegli le piante e ricevi consigli dall'IA.",
        lang: "it",
        start_url: "/gardencanvas",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#f4efea",
        theme_color: "#2f3e2f",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
        // gestione delle notifiche push (public/push-sw.js)
        importScripts: ["push-sw.js"],
        runtimeCaching: [
          {
            // Ricerche piante: rete prima, cache se offline.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/plants"),
            handler: "NetworkFirst",
            options: { cacheName: "plants-api", expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 3600 } },
          },
        ],
      },
    }),
  ],
  server: {
    // In sviluppo le chiamate /api vanno al server Express.
    proxy: { "/api": "http://localhost:3001" },
  },
}));
