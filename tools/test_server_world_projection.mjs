import assert from "node:assert/strict";
import { projectServerWorldEntities } from "../src/protocol/server-world-projection.js";

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
    coordinateSource: "opcode4", presentation: "player-like" },
  { entityId: 11, kind: 1, templateId: 7, x: 320, y: 410, state: 2,
    coordinateSource: "opcode5", presentation: "monster-npc-family" },
]);
assert.deepEqual(projectServerWorldEntities(null), []);
console.log("Server world projection: PASS (verified kind, entity/template IDs, opcode 4/5 coordinates, no template-to-sprite guesses)");
