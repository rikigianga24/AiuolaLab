// Parte di Sentry caricata solo quando il registro degli errori è attivo.
// Importa solo `init`: il resto del pacchetto (registrazione dello
// schermo, prestazioni...) resta fuori e il file scaricato è più leggero.
export { init } from "@sentry/react";
