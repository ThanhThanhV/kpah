import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2CTemplateCatalog, decodeS2CTemplateAsset, encodeTemplateAssetRequest,
  decodeKpahPackedResourceArchive, decodeTemplateSpriteAtlas } from "../src/protocol/template-assets.js";
import { applyInboundWorldPacket } from "../src/protocol/world-state.js";
import { createInitializationState } from "../src/protocol/initialization-state.js";

const catalogPayload = new PacketWriter()
  .writeU8(0).writeI16(46)
  .writeI8(9)
  .writeI8(2).writeI8(4).writeI8(1).writeI8(32).writeI8(48)
  .writeI8(-3).writeI8(5).writeI8(-7).writeI8(8)
  .writeUTF("Wolf").writeI8(6).writeI32(123456)
  .writeI8(2).writeI8(7).writeI8(1).writeI16(3).writeU8(10).writeU8(11).writeU8(12)
  .toUint8Array();
const decoded = decodeS2CTemplateCatalog(catalogPayload);
assert.equal(decoded.handled, true);
assert.equal(decoded.template.templateId, 46);
assert.equal(decoded.template.name, "Wolf");
assert.equal(decoded.template.directionFrameType, 2);
assert.equal(decoded.template.movementStep, 4);
assert.equal(decoded.template.frameWidth, 32);
assert.equal(decoded.template.frameHeight, 48);
assert.equal(decoded.template.frameOffsetX, -3);
assert.equal(decoded.template.shadowOffsetX, -7);
assert.equal(decoded.template.requestType, 2);
assert.equal(decoded.template.resourceId, 7);
assert.deepEqual([...decoded.template.animationData], [10, 11, 12]);

const request = encodeTemplateAssetRequest(decoded.template);
assert.deepEqual([...request], [2, 7, 0, 46]);

const assetPayload = new PacketWriter().writeI16(46).writeBool(true).writeI16(4)
  .writeU8(0x89).writeU8(0x50).writeU8(0x4e).writeU8(0x47).toUint8Array();
const asset = decodeS2CTemplateAsset(assetPayload);
assert.equal(asset.templateId, 46);
assert.equal(asset.responseFlag, true);
assert.deepEqual([...asset.payload], [0x89, 0x50, 0x4e, 0x47]);


const png = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p1sAAAAASUVORK5CYII=",
  "base64"));
const split = Math.floor(png.length / 2);
const resources = [{ name: "7_h", bytes: png.slice(0, split) }, { name: "data", bytes: png.slice(split) }];
const key = Buffer.from("NguyenVanMinh", "ascii");
const archiveWriter = new PacketWriter().writeU8(resources.length);
for (const resource of resources) {
  const name = Buffer.from(resource.name, "ascii");
  archiveWriter.writeI8(name.length);
  for (let i = 0; i < name.length; i++) archiveWriter.writeU8(name[i] ^ key[i % key.length]);
  archiveWriter.writeU16(resource.bytes.length);
}
const payload = Buffer.concat(resources.map(resource => Buffer.from(resource.bytes)));
for (let i = 0; i < payload.length; i++) payload[i] ^= key[i % key.length];
const packed = new Uint8Array([...archiveWriter.toUint8Array(), ...payload]);
const unpacked = decodeKpahPackedResourceArchive(packed);
assert.deepEqual([...unpacked.get("7_h")], [...resources[0].bytes]);
assert.deepEqual([...unpacked.get("data")], [...resources[1].bytes]);
const atlas = decodeTemplateSpriteAtlas({
  templateId: 46, requestType: 2, resourceId: 7, assetMode: 0,
}, packed);
assert.equal(atlas.kind, "image");
assert.equal(atlas.mimeType, "image/png");
assert.deepEqual([...atlas.imageBytes], [...png]);
assert.equal(decodeTemplateSpriteAtlas({
  templateId: 46, requestType: 70, resourceId: 7, assetMode: 0,
}, new Uint8Array([1, 2])).kind, "special");

const unsupported = decodeS2CTemplateCatalog(new PacketWriter().writeU8(1).writeI16(46).writeU8(99).toUint8Array());
assert.equal(unsupported.handled, false);
assert.deepEqual([...unsupported.unconsumedBytes], [99]);

let state = createInitializationState();
state = applyInboundWorldPacket(state, { opcode: 100, payload: catalogPayload }).state;
assert.equal(state.serverWorld.templatesById["46"].name, "Wolf");
state = applyInboundWorldPacket(state, { opcode: -47, payload: assetPayload }).state;
assert.deepEqual([...state.serverWorld.templateAssetPayloadsById["46"]], [0x89, 0x50, 0x4e, 0x47]);
console.log("Original template catalog/assets: PASS (opcode 100 metadata, signed config offsets, C2S -47 request, S2C -47 opaque asset response and original packed PNG extraction)");
