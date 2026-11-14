import assert from "node:assert/strict";
import { advanceOriginalCdMovement, advanceOriginalPlayerMovement, stopOriginalEntityMotionAtCurrentPosition } from "../src/protocol/original-entity-motion.js";

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
const playerStep = advanceOriginalPlayerMovement({
  x: 0, y: 0, targetX: 31, targetY: 40, direction: 0, moving: true,
}, 3);
assert.equal(playerStep.x, 4, "player step uses cT + 1 when either axis exceeds 30");
assert.equal(playerStep.y, 0, "player movement also prioritizes X");
assert.equal(playerStep.direction, 3);
const playerVertical = advanceOriginalPlayerMovement({
  x: 8, y: 12, targetX: 8, targetY: 4, direction: 0, moving: true,
}, 3);
assert.equal(playerVertical.y, 9);
assert.equal(playerVertical.direction, 1);
const playerComplete = advanceOriginalPlayerMovement({
  x: 10, y: 10, targetX: 12, targetY: 12, direction: 2, moving: true,
}, 3);
assert.equal(playerComplete.x, 12);
assert.equal(playerComplete.y, 12);
assert.equal(playerComplete.moving, false);
console.log("Original entity movement: PASS (cd template ticks and z player distance-banded movement)");

const stoppedAfterRevive = stopOriginalEntityMotionAtCurrentPosition({
  x: 41, y: 52, targetX: 200, targetY: 220, serverTargetX: 200, serverTargetY: 220,
  direction: 3, animationCounter: 5, frameState: 1, moving: true,
});
assert.deepEqual(
  {x:stoppedAfterRevive.x,y:stoppedAfterRevive.y,targetX:stoppedAfterRevive.targetX,
    targetY:stoppedAfterRevive.targetY,moving:stoppedAfterRevive.moving,
    frameState:stoppedAfterRevive.frameState,animationCounter:stoppedAfterRevive.animationCounter,
    direction:stoppedAfterRevive.direction},
  {x:41,y:52,targetX:41,targetY:52,moving:false,frameState:0,animationCounter:0,direction:3},
  "revive stops stale movement without teleporting or changing facing",
);
const resumedAfterServerTarget = advanceOriginalPlayerMovement({
  ...stoppedAfterRevive, targetX: 80, targetY: 52, moving: true,
}, 3);
assert.equal(resumedAfterServerTarget.moving, true,
  "a later authoritative movement target can resume after revive");
