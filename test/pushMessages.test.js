import assert from "node:assert/strict";
import { test } from "node:test";
import { alertEmoji, dailyMessage, streakWeeks, taskEmoji, testMessage } from "../server/pushMessages.js";

const rosa = { id: "g:potatura:rosa", kind: "potatura", title: "Pota le rose", where: "Aiuola davanti", end: "2027-02-28", plants: ["Rosa"] };
const pomo = { id: "o:semina:pomodoro", kind: "semina", title: "Semina i pomodori", where: "Orto", end: "2027-03-31", plants: ["Pomodoro"] };
const concime = { id: "g:concime", kind: "concimazione", title: "Concima le aiuole", where: "Giardino", end: "2027-03-15" };

test("notifiche: emoji adatte a pianta, lavoro e meteo", () => {
  assert.equal(taskEmoji(rosa), "🌹");
  assert.equal(taskEmoji(pomo), "🍅");
  assert.equal(taskEmoji(concime), "🌱");
  assert.equal(taskEmoji({ kind: "sconosciuto", title: "Qualcosa" }), "🌿");
  assert.equal(alertEmoji({ title: "Gelo in arrivo" }), "❄️");
  assert.equal(alertEmoji({ title: "Caldo intenso" }), "☀️");
  assert.equal(alertEmoji({ title: "Strano" }), "⚠️");
});

test("notifiche: un solo lavoro ha i pulsanti Fatto e Rimanda", () => {
  const m = dailyMessage({ tasks: [rosa], seed: "2027-02-15:u1" });
  assert.equal(m.title, "🌹 Pota le rose");
  assert.equal(m.taskId, rosa.id);
  assert.match(m.url, /^\/calendario\?attivita=/);
  assert.deepEqual(
    m.actions.map((a) => a.action),
    ["done", "snooze"],
  );
  assert.equal(m.badge, 1);
  assert.ok(m.body.length > 10);
});

test("notifiche: più lavori in un'unica notifica, al massimo tre righe", () => {
  const four = [rosa, pomo, concime, { ...concime, id: "x", title: "Pacciama" }];
  const m = dailyMessage({ tasks: four, seed: "s" });
  assert.match(m.title, /4/);
  assert.equal(m.body.split("\n").length, 4);
  assert.match(m.body, /altre 1/);
  assert.equal(m.badge, 4);
  assert.equal(m.actions, undefined);
});

test("notifiche: l'avviso meteo ha la precedenza e cita i lavori", () => {
  const m = dailyMessage({ tasks: [rosa], alert: { id: "gelo", title: "Gelo stanotte", detail: "Copri le piante in vaso." }, seed: "s" });
  assert.equal(m.title, "❄️ Gelo stanotte");
  assert.match(m.body, /Copri le piante/);
  assert.match(m.body, /pota le rose/);
});

test("notifiche: serie e giornate tranquille", () => {
  const m = dailyMessage({ streak: 3, seed: "s" });
  assert.match(m.title, /🔥.*3/);
  assert.equal(dailyMessage({ streak: 1, seed: "s" }), null, "una settimana sola non è ancora una serie");
  assert.equal(dailyMessage({}), null);
  assert.match(dailyMessage({ tasks: [rosa], streak: 4, seed: "s" }).body, /4 settimane/);
});

test("notifiche: le frasi cambiano da un giorno all'altro", () => {
  const bodies = new Set(Array.from({ length: 20 }, (_, i) => dailyMessage({ tasks: [rosa], seed: `2027-02-${i + 1}:u` }).body));
  assert.ok(bodies.size >= 2);
});

test("notifiche: settimane di fila con lavori fatti", () => {
  const state = {
    a: { done: "2027-02-15" }, // lunedì di questa settimana
    b: { done: "2027-02-10" },
    c: { done: "2027-02-03" },
    d: { done: "2027-01-13" }, // salto: non conta
    e: { snoozedUntil: "2027-02-20" },
  };
  assert.equal(streakWeeks(state, "2027-02-17"), 3);
  // questa settimana ancora niente: conta da quella prima
  assert.equal(streakWeeks({ b: state.b, c: state.c }, "2027-02-17"), 2);
  assert.equal(streakWeeks({}, "2027-02-17"), 0);
});

test("notifiche: messaggio di prova con i pulsanti", () => {
  const m = testMessage();
  assert.equal(m.actions.length, 2);
  assert.equal(m.taskId, undefined, "i pulsanti della prova non toccano il calendario");
});
