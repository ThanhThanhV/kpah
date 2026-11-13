import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import {
  decodeCharacterPartCatalog,
  decodeCharacterPartData,
  DIRECTION_STATE_TO_SEQUENCE,
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
  writer.writeI8(1).writeI8(0);
}
writer.writeI8(9).writeI8(2).writeI8(3);
for (let index = 0; index < 4; index += 1) {
  writer.writeI8(1).writeI8(index + 4);
}
writer.writeU8(0xaa).writeU8(0xbb);

const bytes = writer.toUint8Array();
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
  auxiliary: { x: 1, y: 2, regionIndex: 0, flag: 1 },
  layerGroup: 0,
});
assert.deepEqual(decoded.frameHeights, [{ index: 0, rawValue: 55, byteValue: 55 }]);
assert.equal(decoded.animationSequences.length, 8);
assert.equal(decoded.getSequenceIndex(0, 3), 2);
assert.equal(decoded.getSequenceIndex(1, 3), 6);
assert.equal(decoded.getFrameIndex(0, 3, 0), 0);
assert.equal(decoded.getFrame(1, 3, 0).index, 0);
assert.deepEqual(decoded.optionalFrameMetadata, {
  marker: 9,
  values: [{ index: 0, d: 2, e: 3 }],
});
assert.deepEqual(decoded.additionalSequences, [[4], [5], [6], [7]]);
assert.deepEqual([...decoded.trailingBytes], [0xaa, 0xbb]);
assert.deepEqual(DIRECTION_STATE_TO_SEQUENCE[1], [4, 4, 5, 6, 7, 5, 5, 5, 5, 5, 5, 5, 5]);

assert.throws(() => decodeCharacterPartData(new Uint8Array([1, 0])), /Truncated character part data/);
const catalog = decodeCharacterPartCatalog([
  { index: 4, data: bytes },
  { index: 5, data: new Uint8Array([1, 0]) },
]);
assert.equal(catalog[0].decoded, true);
assert.equal(catalog[0].metadata.frames.length, 1);
assert.equal(catalog[1].decoded, false);
assert.match(catalog[1].error, /Truncated character part data/);
assert.deepEqual([...bytes], [...writer.toUint8Array()], "decoder must not mutate source bytes");

console.log("KPAH character part decoder: PASS (regions, frame pieces, animation maps, optional tables, malformed blobs)");
