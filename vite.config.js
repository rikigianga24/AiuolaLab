import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In sviluppo le chiamate /api vanno al server Express.
    proxy: { "/api": "http://localhost:3001" },
  },
});
