import assert from "node:assert/strict";
import { test } from "node:test";
import { generateTasks, taskStatus, zoneOffset } from "../src/lib/care.js";
import { companionReport, cropActions, CROP_BY_ID, monthsLabel, rotationWarnings } from "../src/lib/crops.js";
import { dailySummary, weatherAlerts } from "../src/lib/weather.js";

const sq = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];

test("calendario: rose e lavanda generano potature con date per zona", () => {
  const project = { type: "garden", beds: [{ id: "a", name: "A", points: sq, plants: [
    { id: "1", name: "Rosa paesaggistica", icon: "rose", x: 1, y: 1, spreadM: 0.8 },
    { id: "2", name: "Lavanda", scientificName: "Lavandula angustifolia", icon: "spike", x: 0.5, y: 0.5, spreadM: 0.5 },
  ] }] };
  const centro = generateTasks([project], { climate: "centro", years: [2027] });
  const nord = generateTasks([project], { climate: "nord", years: [2027] });
  const rose = centro.find((t) => t.title === "Potatura delle rose");
  assert.equal(rose.start, "2027-02-01");
  assert.equal(rose.end, "2027-03-31");
  assert.equal(nord.find((t) => t.title === "Potatura delle rose").start, "2027-02-11");
  assert.ok(centro.some((t) => t.title === "Pota la lavanda"));
  assert.ok(centro.some((t) => t.title === "Rinnova la pacciamatura"));
  assert.equal(zoneOffset(10, "nord"), -10);
});

test("calendario: orto con semine, raccolte e cure specifiche", () => {
  const project = { type: "vegetable", beds: [{ id: "o", name: "Orto 1", kind: "veg", points: sq, plants: [
    { id: "p1", name: "Pomodoro", cropId: "pomodoro", x: 0.5, y: 0.5, spreadM: 0.5 },
    { id: "p2", name: "Pomodoro", cropId: "pomodoro", x: 1, y: 0.5, spreadM: 0.5 },
  ] }] };
  const tasks = generateTasks([project], { climate: "centro", years: [2027] });
  assert.ok(tasks.some((t) => t.title === "Semina in semenzaio: pomodoro" && t.start === "2027-02-01"));
  assert.ok(tasks.some((t) => t.title === "Sfemminella i pomodori"));
  assert.ok(tasks.some((t) => t.title === "Prepara il terreno dell'orto"));
  // lo stesso ortaggio ripetuto non duplica le attività
  assert.equal(tasks.filter((t) => t.title === "Sfemminella i pomodori").length, 1);
});

test("stato delle attività", () => {
  const t = { id: "x", start: "2027-03-01", end: "2027-03-31" };
  assert.equal(taskStatus(t, {}, "2027-03-10"), "now");
  assert.equal(taskStatus(t, {}, "2027-02-10"), "upcoming");
  assert.equal(taskStatus(t, { x: { done: "2027-03-05" } }, "2027-03-10"), "done");
  assert.equal(taskStatus(t, { x: { snoozedUntil: "2027-03-20" } }, "2027-03-10"), "snoozed");
});

test("consociazioni, rotazione e mesi", () => {
  const plants = [
    { cropId: "pomodoro", x: 0, y: 0 },
    { cropId: "patata", x: 0.4, y: 0 },
    { cropId: "basilico", x: 0, y: 0.3 },
  ];
  const r = companionReport(plants);
  assert.equal(r.bad.length, 1);
  assert.match(r.bad[0].a + r.bad[0].b, /Pomodoro|Patata/);
  assert.ok(r.good.some((g) => /Basilico/.test(g.a + g.b)));
  const bed = { plants: [{ cropId: "pomodoro" }], history: [{ year: 2026, families: ["solanacee"] }] };
  assert.deepEqual(rotationWarnings(bed, 2027), ["Solanacee"]);
  assert.equal(monthsLabel([2, 3, 8]), "feb–mar, ago");
  assert.deepEqual(cropActions(CROP_BY_ID.lattuga, 3), ["semenzaio", "semina", "trapianto"]);
});

test("meteo: riepilogo giornaliero e avvisi di gelo e pioggia", () => {
  const ts = [];
  for (let h = 0; h < 48; h++) {
    const time = new Date(Date.UTC(2027, 0, 10, h)).toISOString();
    const day2 = h >= 23;
    ts.push({
      time,
      data: {
        instant: { details: { air_temperature: day2 ? -4 + (h % 3) : 8, wind_speed: 3 } },
        next_1_hours: { summary: { symbol_code: "rain" }, details: { precipitation_amount: day2 ? 0 : 1 } },
      },
    });
  }
  const days = dailySummary(ts);
  assert.ok(days.length >= 2);
  assert.ok(days[0].rain >= 15);
  const alerts = weatherAlerts(days, { pots: true, irrigation: true });
  assert.ok(alerts.some((a) => a.type === "rain"));
  assert.ok(alerts.some((a) => a.type === "frost" && a.severity === "high"));
});
