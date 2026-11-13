import { PacketWriter } from "./generated/packet-codec.js";

class Reader {
  constructor(bytes) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError("Packet payload must be Uint8Array");
    this.bytes = bytes;
    this.offset = 0;
  }
  require(length) {
    if (!Number.isInteger(length) || length < 0 || this.offset + length > this.bytes.length) {
      throw new RangeError("Truncated template packet");
    }
  }
  readU8() { this.require(1); return this.bytes[this.offset++]; }
  readI8() { const value = this.readU8(); return value > 127 ? value - 256 : value; }
  readU16() { this.require(2); const value = (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1]; this.offset += 2; return value; }
  readI16() { const value = this.readU16(); return value > 0x7fff ? value - 0x10000 : value; }
  readI32() {
    this.require(4);
    const value = (this.bytes[this.offset] * 0x1000000)
      + (this.bytes[this.offset + 1] << 16)
      + (this.bytes[this.offset + 2] << 8)
      + this.bytes[this.offset + 3];
    this.offset += 4;
    return value > 0x7fffffff ? value - 0x100000000 : value;
  }
  readBoolean() { return this.readU8() !== 0; }
  readBytes(length) { this.require(length); const value = this.bytes.slice(this.offset, this.offset + length); this.offset += length; return value; }
  readUTF() { return decodeModifiedUtf8(this.readBytes(this.readU16())); }
  get remaining() { return this.bytes.length - this.offset; }
}

function decodeModifiedUtf8(bytes) {
  const units = [];
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++];
    if ((first & 0x80) === 0) {
      units.push(first);
    } else if ((first & 0xe0) === 0xc0) {
      if (i >= bytes.length) throw new RangeError("Truncated modified UTF-8 sequence");
      const second = bytes[i++];
      if ((second & 0xc0) !== 0x80) throw new TypeError("Invalid modified UTF-8 continuation");
      units.push(((first & 0x1f) << 6) | (second & 0x3f));
    } else if ((first & 0xf0) === 0xe0) {
      if (i + 1 >= bytes.length) throw new RangeError("Truncated modified UTF-8 sequence");
      const second = bytes[i++];
      const third = bytes[i++];
      if ((second & 0xc0) !== 0x80 || (third & 0xc0) !== 0x80) {
        throw new TypeError("Invalid modified UTF-8 continuation");
      }
      units.push(((first & 0x0f) << 12) | ((second & 0x3f) << 6) | (third & 0x3f));
    } else {
      throw new TypeError("Invalid modified UTF-8 leading byte");
    }
  }
  let value = "";
  for (let i = 0; i < units.length; i += 4096) value += String.fromCharCode(...units.slice(i, i + 4096));
  return value;
}

/**
 * S2C opcode 100, mj.z(acu): type byte + signed-short template ID.
 * Type 0 carries the 9-byte cg config, UTF name and cg metadata.
 */
export function decodeS2CTemplateCatalog(payload) {
  const reader = new Reader(payload);
  const catalogType = reader.readU8();
  const templateId = reader.readI16();
  if (catalogType !== 0) {
    return { handled: false, catalogType, templateId, unconsumedBytes: reader.readBytes(reader.remaining) };
  }
  const configLength = reader.readI8();
  if (configLength !== 9) throw new RangeError("Template config must contain exactly 9 bytes");
  const config = reader.readBytes(configLength);
  const name = reader.readUTF();
  const extraByte = reader.readI8();
  const extraInt = reader.readI32();
  const requestType = reader.readI8();
  const resourceId = reader.readI8();
  const assetMode = reader.readI8();
  let animationData = null;
  if (assetMode === 1) {
    const animationLength = reader.readI16();
    if (animationLength < 0) throw new RangeError("Invalid template animation length");
    animationData = reader.readBytes(animationLength);
  }
  if (reader.remaining !== 0) throw new RangeError("Unexpected trailing bytes in opcode 100 template catalog");
  const [directionFrameType, movementStep, actorType, frameWidth, frameHeight,
    shadowOffsetX, shadowOffsetY, spriteOffsetX, spriteOffsetY] = config;
  return {
    handled: true,
    catalogType,
    templateId,
    template: {
      templateId,
      name,
      directionFrameType,
      movementStep,
      actorType,
      frameWidth,
      frameHeight,
      shadowOffsetX,
      shadowOffsetY,
      spriteOffsetX,
      spriteOffsetY,
      extraByte,
      extraInt,
      requestType,
      resourceId,
      assetMode,
      animationData,
      rawConfig: new Uint8Array(config),
    },
  };
}

/**
 * S2C opcode -47, ka dispatcher: template ID, boolean, signed-short length,
 * then opaque sprite/atlas payload passed to cg.a(byte[]).
 */
export function decodeS2CTemplateAsset(payload) {
  const reader = new Reader(payload);
  const templateId = reader.readI16();
  const responseFlag = reader.readBoolean();
  const length = reader.readI16();
  if (length < 0) throw new RangeError("Invalid template asset payload length");
  const assetPayload = reader.readBytes(length);
  if (reader.remaining !== 0) throw new RangeError("Unexpected trailing bytes in opcode -47 template asset");
  return { templateId, responseFlag, payload: assetPayload };
}

/**
 * Original cg.b() C2S opcode -47 request: requestType, resourceId, template ID.
 */
export function encodeTemplateAssetRequest(template) {
  if (!template || !Number.isInteger(template.requestType)
    || !Number.isInteger(template.resourceId) || !Number.isInteger(template.templateId)) {
    throw new TypeError("Template request metadata is incomplete");
  }
  return new PacketWriter()
    .writeI8(template.requestType)
    .writeI8(template.resourceId)
    .writeI16(template.templateId)
    .toUint8Array();
}
