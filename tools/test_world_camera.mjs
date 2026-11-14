import assert from "node:assert/strict";
import { setCameraFollowTarget } from "../src/protocol/camera-follow.js";

function createCamera(){
  const calls=[];
  return {
    calls,
    setBounds(...args){calls.push(["setBounds",...args]);return this;},
    setRoundPixels(value){calls.push(["setRoundPixels",value]);return this;},
    startFollow(...args){calls.push(["startFollow",...args]);return this;},
    stopFollow(){calls.push(["stopFollow"]);return this;},
    setDeadzone(...args){calls.push(["setDeadzone",...args]);return this;},
  };
}
const camera=createCamera();
const actor={x:120,y:240};
setCameraFollowTarget(camera,actor,[true,0.12,0.12]);
assert.equal(camera.calls.filter(call=>call[0]==="startFollow").length,1);
assert.equal(camera.calls.some(call=>call[0]==="stopFollow"),false);
setCameraFollowTarget(camera,null);
assert.equal(camera.calls.filter(call=>call[0]==="stopFollow").length,1,
  "camera must release a despawned or unavailable actor target");
console.log("World camera lifecycle: PASS (follow target and stop following when target is absent)");
