import assert from "node:assert/strict";
import { configureWorldCamera } from "../src/world-runtime.js";

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
const scene={cameras:{main:camera}};
const bounds={x:0,y:0,width:960,height:560};
const actor={x:120,y:240};
configureWorldCamera(scene,actor,bounds,{lerpX:0.12,lerpY:0.12,deadzone:{width:180,height:100}});
assert.equal(camera.calls.filter(call=>call[0]==="startFollow").length,1);
assert.equal(camera.calls.some(call=>call[0]==="stopFollow"),false);
configureWorldCamera(scene,null,bounds);
assert.equal(camera.calls.filter(call=>call[0]==="stopFollow").length,1,
  "camera must release a despawned or unavailable actor target");
console.log("World camera lifecycle: PASS (follow target and stop following when target is absent)");
