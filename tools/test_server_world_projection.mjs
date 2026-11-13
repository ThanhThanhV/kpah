import assert from "node:assert/strict";
import { projectServerWorldEntities } from "../src/protocol/server-world-projection.js";
import { resolveOriginalEntityFactoryClass, resolveOriginalEntityFrameIndex } from "../src/protocol/original-entity-factory.js";

const projected = projectServerWorldEntities({
  entityOrder: [10, 11, 12, 13],
  entitiesById: {
    10: { kind: 0, templateId: 4, x: 100, y: 200, state: 1 },
    11: { kind: 1, templateId: 7, x: 300, y: 400, state: 2,
      snapshot: { name: "Wolf", x: 320, y: 410 } },
    12: { kind: 3, templateId: 9, x: 500, y: 600, active: false },
    13: { kind: 99, templateId: 255, x: null, y: 10 },
  },
});
assert.deepEqual(projected, [
  { entityId: 10, kind: 0, templateId: 4, x: 100, y: 200, state: 1,
    coordinateSource: "opcode4", presentation: "player-like", factoryClass: "hd", templateName: null,
    frameWidth: null, frameHeight: null, movementStep: null, templateReady: false },
  { entityId: 11, kind: 1, templateId: 7, x: 320, y: 410, state: 2,
    coordinateSource: "opcode5", presentation: "monster-npc-family", factoryClass: "cd", templateName: null,
    frameWidth: null, frameHeight: null, movementStep: null, templateReady: false },
]);
const withTemplate = projectServerWorldEntities({
  entityOrder: [46],
  entitiesById: { 46: { kind: 1, templateId: 46, x: 12, y: 34 } },
  templatesById: { 46: { name: "Wolf", frameWidth: 32, frameHeight: 48, movementStep: 4 } },
});
assert.equal(withTemplate[0].templateName, "Wolf");
assert.equal(withTemplate[0].frameWidth, 32);
assert.equal(withTemplate[0].frameHeight, 48);
assert.equal(withTemplate[0].movementStep, 4);
assert.equal(withTemplate[0].templateReady, true);
assert.equal(withTemplate[0].factoryClass, "w");
assert.equal(resolveOriginalEntityFactoryClass(0, 0, 0, 1), "hd");
assert.equal(resolveOriginalEntityFactoryClass(0, 0, 0, -1), "z");
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
assert.deepEqual(projectServerWorldEntities(null), []);
console.log("Server world projection: PASS (verified kind, entity/template IDs, opcode 4/5 coordinates, no template-to-sprite guesses)");
