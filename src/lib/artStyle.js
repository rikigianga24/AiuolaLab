// Stile del disegno: "tempera" (dipinto, predefinito) o "classico"
// (lo stile originale). È un'impostazione dell'utente; qui si tiene quello
// attivo, letto da icone, prato, coperture e bordure.
export const ART_STYLES = {
  tempera: { label: "Tempera", note: "Dipinto a mano, con lo spessore del colore", icon: "fa-palette" },
  classico: { label: "Classico", note: "Lo stile originale, più pulito e leggero", icon: "fa-shapes" },
};

let current = "tempera";

export const getArtStyle = () => current;

export function setArtStyle(style) {
  current = ART_STYLES[style] ? style : "tempera";
}
