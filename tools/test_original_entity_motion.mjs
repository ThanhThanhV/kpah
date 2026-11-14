import assert from "node:assert/strict";
import { advanceOriginalCdMovement, advanceOriginalHdMovement, advanceOriginalPlayerMovement, stopOriginalEntityMotionAtCurrentPosition } from "../src/protocol/original-entity-motion.js";

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
const playerSnapAtExactXStep = advanceOriginalPlayerMovement({
  x: 10, y: 10, targetX: 13, targetY: 12, direction: 2, moving: true,
}, 3);
assert.equal(playerSnapAtExactXStep.x, 13,
  "original hd snaps X when the remaining distance equals cT");
assert.equal(playerSnapAtExactXStep.y, 12);
assert.equal(playerSnapAtExactXStep.moving, false,
  "the exact X-step boundary must not overshoot the server destination");

const hdStep = advanceOriginalHdMovement({
  x: 10, y: 10, targetX: 18, targetY: 18, direction: 0, moving: true,
});
assert.equal(hdStep.x, 14, "original hd uses its fixed cT=4 step, not the z snapshot speed");
assert.equal(hdStep.y, 10, "original hd advances X before Y");
assert.equal(hdStep.direction, 3, "original hd records rightward world direction");
const hdSnapAtExactXStep = advanceOriginalHdMovement({
  x: 10, y: 10, targetX: 14, targetY: 10, direction: 0, moving: true,
});
assert.equal(hdSnapAtExactXStep.x, 14);
assert.equal(hdSnapAtExactXStep.moving, false,
  "original hd snaps X at the exact cT boundary when Y is already aligned");
const hdVerticalAtExactStep = advanceOriginalHdMovement({
  x: 10, y: 14, targetX: 10, targetY: 10, direction: 0, moving: true,
});
assert.equal(hdVerticalAtExactStep.y, 10);
assert.equal(hdVerticalAtExactStep.moving, true,
  "original hd does not snap Y at the exact cT boundary");
assert.equal(advanceOriginalHdMovement(hdVerticalAtExactStep).moving, false,
  "original hd snaps Y on the following tick");
const playerVerticalAtExactStep = advanceOriginalPlayerMovement({
  x: 8, y: 12, targetX: 8, targetY: 9, direction: 0, moving: true,
}, 3);
assert.equal(playerVerticalAtExactStep.y, 9,
  "original hd advances Y by cT when the remaining distance equals cT");
assert.equal(playerVerticalAtExactStep.moving, true,
  "unlike X, Y is not marked snapped at the exact cT boundary");
const playerVerticalSnapAfterExactStep = advanceOriginalPlayerMovement(
  playerVerticalAtExactStep, 3,
);
assert.equal(playerVerticalSnapAfterExactStep.y, 9);
assert.equal(playerVerticalSnapAfterExactStep.moving, false,
  "the following tick snaps Y because its remaining distance is now below cT");

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
