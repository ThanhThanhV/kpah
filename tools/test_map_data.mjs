import assert from "node:assert/strict";
import { decodeOriginalMapData } from "../src/protocol/map-data.js";

const payload=Uint8Array.from([
  2,2,             // width, height
  1,254,3,4,       // base tiles; 254 is normalized to 255
  0,0,1,1,0,5,255, // one rectangle override, then sentinel
  1,1,0,6,255,     // one point override, then sentinel
  3,4,5,254,       // one decoration; 254 is the original terminator
  1,               // map mode
  1,               // one portal
  5,6,0x34,0x12,7,8,
  1,               // one NPC
  9,10,11,
  99               // opaque trailing byte
]);
const map=decodeOriginalMapData(payload);
assert.equal(map.width,2);
assert.equal(map.height,2);
assert.deepEqual(map.tileRows,[[1,255],[3,4]]);
assert.equal(map.mapMode,true);
assert.deepEqual(map.rectangleOverrides,[{firstColumn:0,firstRow:0,columnSpan:1,rowSpan:1,cells:[{row:0,column:0,tileId:5}]}]);
assert.deepEqual(map.pointOverrides,[{row:1,column:1,tileId:6}]);
assert.deepEqual(map.decorations,[{type:3,x:4,y:5}]);
assert.deepEqual(map.portals,[{x:5,y:6,portalId:0x1234,type:7,flags:8}]);
assert.deepEqual(map.npcs,[{x:9,y:10,id:11}]);
assert.deepEqual([...map.trailingBytes],[99]);
assert.throws(()=>decodeOriginalMapData(Uint8Array.from([2,2,1])),
  /Truncated map data while reading base tile grid/);
console.log("Original map data decoder: PASS (tile grid, sentinels, portal, NPC and truncation)");
