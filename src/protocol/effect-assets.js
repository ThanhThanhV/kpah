import { PacketWriter } from "./generated/packet-codec.js";

/** Original jy.j(short): C2S opcode -51 requests one image resource by ID. */
export function encodeEffectAssetRequest(resourceId) {
  if (!Number.isInteger(resourceId) || resourceId < -0x8000 || resourceId > 0x7fff) {
    throw new RangeError("Effect resource ID must fit a signed short");
  }
  return new PacketWriter().writeI16(resourceId).toUint8Array();
}
