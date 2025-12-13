export const createPlant = (name, width, height, soil, water) => ({
  id: crypto.randomUUID(),
  name,
  width,
  height,
  soil,
  water,
  x: 0,
  y: 0,
});