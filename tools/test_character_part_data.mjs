import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import {
  decodeCharacterPartCatalog,
  decodeCharacterPartData,
  getCharacterFrameDrawOrder,
  DIRECTION_STATE_TO_SEQUENCE,
  characterPartImageResourceId,
  advanceCharacterPartPlayback,
  triggerCharacterPartAction,
} from "../src/protocol/character-part-data.js";

const writer = new PacketWriter()
  .writeI8(1)
  .writeU8(0).writeU8(10).writeU8(20).writeU8(30).writeU8(40)
  .writeI16(1)
  .writeI8(1)
  .writeI16(5).writeI16(-3).writeI8(0)
  .writeI16(1).writeI16(2).writeI8(0).writeI8(1)
  .writeI8(0)
  .writeI16(1).writeI16(55);

for (let sequence = 0; sequence < 8; sequence += 1) {
  const length = sequence === 1 || sequence === 2 ? 3 : sequence === 6 ? 2 : 1;
  writer.writeI8(length);
  for (let frame = 0; frame < length; frame += 1) writer.writeI8(0);
}
writerconst bytes = writer.toUint8Array();
const decoded = decodeCharacterPartData(bytes);

assert.equal(decoded.format, "kpah-character-part-v1");
assert.equal(decoded.regionCount, 1);
assert.deepEqual(decoded.regions[0], {
  index: 0, discardedByte: 0, x: 10, y: 20, width: 30, height: 40,
});
assert.equal(decoded.frameCount, 1);
assert.deepEqual(decoded.frames[0].pieces[0], {
  index: 0,
  x: 5,
  y: -3,
  regionIndex: 0,
  flip: 0,
  discardedAuxiliary: { x: 1, y: 2, regionIndex: 0, byte: 1 },
  layerGroup: 0,
});
assert.deepEqual(decoded.frameHeights, [{ index: 0, rawValue: 55, byteValue: 55 }]);
assert.equal(decoded.animationSequences.length, 8);
assert.equal(decoded.getSequenceIndex(0, 3), 2);
assert.equal(decoded.getSequenceIndex(1, 3), 6);
assert.equal(decoded.getFrameIndex(0, 3, 0), 0);
assert.equal(decoded.getFrame(1, 3, 0).index, 0);
assert.deepEqual(getCharacterFrameDrawOrder({pieces:[
  {index:0,layerGroup:0},{index:1,layerGroup:2},{index:2,layerGroup:0},{index:3,layerGroup:-1},
]}).map(piece=>piece.index),[1,3,0,2],
  "renderer draws f.b (non-zero groups) before f.a (group zero), preserving source order");

let playback=triggerCharacterPartAction({state:0,direction:0,transform:2,frameCursor:4});
assert.deepEqual(playback,{state:3,direction:0,transform:2,frameCursor:0},
  "attack event starts one-shot action state at frame zero");
playback=advanceCharacterPartPlayback(playback,decoded,{moving:false});
assert.deepEqual(playback,{state:3,direction:0,transform:2,frameCursor:1},
  "multi-frame action sequence advances without looping");
playback=advanceCharacterPartPlayback(playback,decoded,{moving:false});
assert.deepEqual(playback,{state:3,direction:0,transform:2,frameCursor:2});
playback=advanceCharacterPartPlayback(playback,decoded,{moving:false});
assert.deepEqual(playback,{state:0,direction:0,transform:2,frameCursor:0},
  "action sequence returns to idle after its final frame");
let reversePlayback=triggerCharacterPartAction({state:0,direction:1,transform:0,frameCursor:0});
reversePlayback=advanceCharacterPartPlayback(reversePlayback,decoded,{moving:false});
assert.equal(reversePlayback.state,3);
assert.equal(reversePlayback.frameCursor,1,"reverse-facing action uses direction 1's action sequence");
reversePlayback=advanceCharacterPartPlayback(reversePlayback,decoded,{moving:false});
assert.equal(reversePlayback.state,0,"reverse-facing action also completes once");
playback=advanceCharacterPartPlayback({state:0,direction:0,transform:0,frameCursor:0},decoded,{
  moving:true,direction:2,x:10,y:10,targetX:4,targetY:2,
});
assert.deepEqual(playback,{state:2,direction:0,transform:2,frameCursor:0},
  "diagonal movement follows the original X-first left-facing direction");
playback=advanceCharacterPartPlayback(playback,decoded,{
  moving:true,direction:2,x:9,y:9,targetX:4,targetY:2,
});
assert.equal(playback.frameCursor,1,
  "walking advances to the next frame only after its initial pose has been shown");
playback=advanceCharacterPartPlayback(playback,decoded,{
  moving:true,direction:3,x:10,y:10,targetX:20,targetY:2,
});
assert.equal(playback.transform,0,"right movement restores the unmirrored atlas");
playback=advanceCharacterPartPlayback(playback,decoded,{
  moving:true,direction:1,x:10,y:10,targetX:10,targetY:2,
});
assert.equal(playback.direction,1,"up movement selects the second animation direction");
playback=advanceCharacterPartPlayback(playback,decoded,{
  moving:true,direction:0,x:10,y:10,targetX:10,targetY:20,
});
assert.equal(playback.direction,0,"down movement selects the first animation direction");

assert.deepEqual(DIRECTION_STATE_TO_SEQUENCE[1], [4, 4, 5, 6, 7, 5, 5, 5, 5, 5, 5, 5, 5]);
assert.equal(characterPartImageResourceId(0), 12000);
assert.equal(characterPartImageResourceId(127), 12127);
assert.throws(() => characterPartImageResourceId(-1), /signed byte/);
assert.throws(() => characterPartImageResourceId(128), /signed byte/);

assert.throws(() => decodeCharacterPartData(new Uint8Array([1, 0])), /Truncated character part data/);
assert.throws(() => decodeCharacterPartData(Uint8Array.from([...bytes, 0xaa])), /Unexpected trailing character part data/);
const catalog = decodeCharacterPartCatalog([
  { index: 4, data: bytes },
  { index: 5, data: new Uint8Array([1, 0]) },
]);
assert.equal(catalog[0].decoded, true);
assert.equal(catalog[0].metadata.frames.length, 1);
assert.equal(catalog[1].decoded, false);
assert.match(catalog[1].error, /Truncated character part data/);
assert.deepEqual([...bytes], [...writer.toUint8Array()], "decoder must not mutate source bytes");

console.log("KPAH character part decoder: PASS (atlas regions, renderer piece fields, layer order data, animation maps, malformed blobs)");
