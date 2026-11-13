import { PacketWriter } from "./generated/packet-codec.js";

/** Original jy.j(short): C2S opcode -51 requests one image resource by ID. */
export function encodeEffectAssetRequest(resourceId) {
  if (!Number.isInteger(resourceId) || resourceId < -0x8000 || resourceId > 0x7fff) {
    throw new RangeError("Effect resource ID must fit a signed short");
  }
  return new PacketWriter().writeI16(resourceId).toUint8Array();
}


/** Original hz.a(Graphics) requests actor images at a derived resource ID. */
export function actorEffectImageResourceId(animationId) {
  if (!Number.isInteger(animationId) || animationId < -0x8000 || animationId > 0x7fff) {
    throw new RangeError("Actor animation ID must fit a signed short");
  }
  const resourceId = animationId + (animationId < 301 ? 8700 : 14100);
  if (resourceId < -0x8000 || resourceId > 0x7fff) {
    throw new RangeError("Derived actor image resource ID must fit a signed short");
  }
  return resourceId;
}
