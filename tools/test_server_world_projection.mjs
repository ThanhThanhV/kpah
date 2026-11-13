import assert from "node:assert/strict";
import { projectServerWorldEntities } from "../src/protocol/server-world-projection.js";
import { resolveOriginalEntityFactoryClass, resolveOriginalEntityFrameIndex } from "../src/protocol/original-entity-factory.js";
import { getServerCombatEventsAfter } from "../src/protocol/server-world-combat.js";

const projected = projectServerWorldEntities({
  entityOrder: [10, 11, 12, 13],
  characterResourcesById: { 10: { statsByKey: { hp: { key: "hp", value: 1234 }, mp: { key: "mp", value: 567 } } } },
  characterLevelsById: { 10: { level: 25, valueA: 5000, valueB: 600 } },
  entitiesById: {
    10: { kind: 0, templateId: 4, x: 100, y: 200, state: 1, marker: 3, currentHp: 987, maxHp: 2500, snapshot: { name: "ThanhKiem" } },
    11: { kind: 1, templateId: 7, x: 300, y: 400, state: 2, currentHp: 65, maxHp: 100,
      snapshot: { name: "Wolf", x: 320, y: 410 } },
    12: { kind: 3, templateId: 9, x: 500, y: 600, active: false },
    13: { kind: 99, templateId: 255, x: null, y: 10 },
  },
}, 10);
assert.deepEqual(projected, [
  { entityId: 10, kind: 0, isLocalPlayer: true, templateId: 4, name: "ThanhKiem", currentHp: 987, maxHp: 2500, level: 25,
    resourceStats: [{ key: "hp", value: 1234 }, { key: "mp", value: 567 }],
    levelUpdateValues: { valueA: 5000, valueB: 600 }, x: 100, y: 200, state: 1, marker: 3,
    coordinateSource: "opcode4", presentation: "player-like", factoryClass: "hd", targetX: null, targetY: null, movementPending: false, playerMovementStep: 3, templateName: null,
    frameWidth: null, frameHeight: null, movementStep: null, templateType: null,
    frameOffsetX: null, frameOffsetY: null, shadowOffsetX: null, shadowOffsetY: null, templateReady: false },
  { entityId: 11, kind: 1, isLocalPlayer: false, templateId: 7, name: "Wolf", currentHp: 65, maxHp: 100, level: null, resourceStats: [], levelUpdateValues: null,
    x: 320, y: 410, state: 2, marker: null,
    coordinateSource: "opcode5", presentation: "monster-npc-family", factoryClass: "cd", targetX: null, targetY: null, movementPending: false, playerMovementStep: 3, templateName: null,
    frameWidth: null, frameHeight: null, movementStep: null, templateType: null,
    frameOffsetX: null, frameOffsetY: null, shadowOffsetX: null, shadowOffsetY: null, templateReady: false },
]);
const withTemplate = projectServerWorldEntities({
  entityOrder: [46],
  entitiesById: { 46: { kind: 1, templateId: 46, x: 12, y: 34 } },
  templatesById: { 46: { name: "Wolf", frameWidth: 32, frameHeight: 48, movementStep: 4 } },
});
assert.equal(withTemplate[0].templateName, "Wolf");
assert.equal(projected[0].name, "ThanhKiem", "opcode 5 snapshot name is exposed without interpreting opaque stat fields");
assert.equal(projected[0].currentHp, 987, "post-combat current HP is projected as a verified current value");
assert.equal(projected[0].maxHp, 2500, "opcode 7 max HP is projected");
assert.equal(projected[1].maxHp, 100);
assert.equal(projected[0].level, 25, "opcode 33 level is projected");
assert.deepEqual(projected[0].resourceStats, [{ key: "hp", value: 1234 }, { key: "mp", value: 567 }]);
assert.deepEqual(projected[0].levelUpdateValues, { valueA: 5000, valueB: 600 });
assert.equal(projected[1].currentHp, 65);
assert.equal(withTemplate[0].frameWidth, 32);
assert.equal(withTemplate[0].frameHeight, 48);
assert.equal(withTemplate[0].movementStep, 4);
assert.equal(withTemplate[0].templateType, null);
assert.equal(withTemplate[0].frameOffsetX, null);
assert.equal(withTemplate[0].templateReady, true);
assert.equal(withTemplate[0].factoryClass, "w");
assert.equal(resolveOriginalEntityFactoryClass(0, 0, 0, 1), "hd");
assert.equal(resolveOriginalEntityFactoryClass(0, 0, 0, -1), "z");
const playerWithoutPartMarker = projectServerWorldEntities({
  entityOrder: [14], entitiesById: { 14: { kind: 0, templateId: 0, x: 1, y: 2, marker: -1 } },
});
assert.equal(playerWithoutPartMarker[0].factoryClass, "z", "kind-0 renderer uses the opcode-4 marker byte as the part index");
assert.equal(resolveOriginalEntityFactoryClass(1, 91, 0, -1), "v");
assert.equal(resolveOriginalEntityFactoryClass(1, 46, 0, -1), "w");
assert.equal(resolveOriginalEntityFactoryClass(1, 100, 0, -1), "cf");
assert.equal(resolveOriginalEntityFactoryClass(1, 7, 1, -1), "cf");
assert.equal(resolveOriginalEntityFactoryClass(1, 7, 0, -1), "cd");
assert.equal(resolveOriginalEntityFactoryClass(3, 0, 0, -1), "al");
assert.equal(resolveOriginalEntityFactoryClass(4, 0, 0, -1), "am");
assert.equal(resolveOriginalEntityFactoryClass(6, 0, 0, -1), "ak");
assert.equal(resolveOriginalEntityFactoryClass(14, 0, 0, -1), "bq");
assert.equal(resolveOriginalEntityFactoryClass(99, 0, 0, -1), null);
assert.equal(resolveOriginalEntityFrameIndex(0, 3, 0), 12);
assert.equal(resolveOriginalEntityFrameIndex(1, 2, 0), 0);
assert.equal(resolveOriginalEntityFrameIndex(2, 3, 3), 3);
assert.equal(resolveOriginalEntityFrameIndex(3, 1, 0), 4);
assert.equal(resolveOriginalEntityFrameIndex(4, 2, 3), 0);
assert.equal(resolveOriginalEntityFrameIndex(5, 0, 0), null);
assert.equal(resolveOriginalEntityFrameIndex(0, 4, 0), null);
const combatBatch = getServerCombatEventsAfter({
  combatEventSequence: 5,
  combatEvents: [
    { sequence: 3, damage: 10 },
    { sequence: 4, damage: 20 },
    { sequence: 5, damage: 30 },
  ],
}, 3);
assert.deepEqual(combatBatch.events.map(event => event.damage), [20, 30]);
assert.equal(combatBatch.lastSequence, 5);
const evictedBatch = getServerCombatEventsAfter({
  combatEventSequence: 125,
  combatEvents: [{ sequence: 125, damage: 50 }],
}, 100);
assert.deepEqual(evictedBatch.events.map(event => event.damage), [50]);
assert.equal(evictedBatch.lastSequence, 125);
const restartedSessionBatch = getServerCombatEventsAfter({
  combatEventSequence: 1,
  combatEvents: [{ sequence: 1, damage: 75 }],
}, 125);
assert.deepEqual(restartedSessionBatch.events.map(event => event.damage), [75]);
assert.equal(restartedSessionBatch.lastSequence, 1,
  "a new protocol session may restart its event sequence");

assert.deepEqual(projectServerWorldEntities(null), []);
console.log("Server world projection: PASS (verified kind, entity/template IDs, opcode 4/5 coordinates, verified template metadata and original idle frame mapping)");
