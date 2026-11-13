import assert from "node:assert/strict";
import { advanceOriginalCdMovement } from "../src/protocol/original-entity-motion.js";

let motion = {
  x: 10, y: 10, targetX: 19, targetY: 19,
  direction: 0, animationCounter: 0, frameState: 0, moving: true,
};
const template = { movementStep: 3, directionFrameType: 0 };
motion = advanceOriginalCdMovement(motion, template);
assert.deepEqual(
  { x: motion.x, y: motion.y, direction: motion.direction, frameState: motion.frameState, moving: motion.moving },
  { x: 13, y: 10, direction: 3, frameState: 0, moving: true },
  "original cd moves X first",
);
motion = advanceOriginalCdMovement(motion, template);
assert.deepEqual({ x: motion.x, y: motion.y, direction: motion.direction }, { x: 16, y: 10, direction: 3 });
motion = advanceOriginalCdMovement(motion, template);
assert.deepEqual({ x: motion.x, y: motion.y, direction: motion.direction }, { x: 19, y: 13, direction: 0 },
  "after X reaches target, original cd advances Y");
assert.equal(motion.frameState, 1, "cd movement frame state changes after O > 2");

motion = advanceOriginalCdMovement(motion, template);
motion = advanceOriginalCdMovement(motion, template);
assert.equal(motion.y, 19);
assert.equal(motion.moving, false);
assert.equal(motion.targetX, null);
assert.equal(motion.frameState, 0);

const vertical = advanceOriginalCdMovement({
  x: 5, y: 15, targetX: 5, targetY: 6, direction: 0, moving: true,
}, template);
assert.equal(vertical.y, 12);
assert.equal(vertical.direction, 1);

const stationaryType = advanceOriginalCdMovement({
  x: 5, y: 5, targetX: 100, targetY: 100, direction: 0, moving: true,
}, { movementStep: 3, directionFrameType: 4 });
assert.equal(stationaryType.x, 5);
assert.equal(stationaryType.y, 5);
assert.equal(stationaryType.moving, false);

const noSpeed = advanceOriginalCdMovement({
  x: 5, y: 5, targetX: 10, targetY: 10, moving: true,
}, { movementStep: 0, directionFrameType: 0 });
assert.equal(noSpeed.moving, false);
console.log("Original cd movement: PASS (40ms tick primitive, X-first axis priority, template step, facing and 2-frame walk state)");
