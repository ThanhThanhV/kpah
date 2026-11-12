import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { C2S_OPCODE62_MODES, encodeC2SOpcode62, decodeC2SOpcode62 } from "../src/protocol/generated/command-variant-codec.js";
assert.deepEqual(C2S_OPCODE62_MODES,[0,2,3,4,5,6,7]);
const cases=[
 {mode:0,fieldShort:-123,fieldIntA:123456,fieldIntB:-654321},
 {mode:2,fieldByteA:-1,fieldByteB:2,fieldByteC:-3,fieldByteD:4,fieldByteE:-5},
 {mode:3,fieldByte:-8,fieldShort:2345},
 {mode:4,fieldByte:-9},
 {mode:5},
 {mode:6,fieldByte:10,fieldShort:-2345,fieldInt:987654},
 {mode:7,text:"Kỹ năng và vật phẩm"}
];
for(const values of cases){
 const encoded=encodeC2SOpcode62(values);
 const decoded=decodeC2SOpcode62(encoded);
 const {mode,...fields}=values;
 assert.equal(decoded.mode,mode);
 assert.deepEqual(decoded.fields,fields);
 assert.equal(decoded.unconsumedBytes.length,0);
 assert.equal(decoded.trailingBytes.length,0);
}
const expected0=new PacketWriter().writeI8(0).writeI16(-123).writeI32(123456).writeI32(-654321).toUint8Array();
assert.deepEqual([...encodeC2SOpcode62(cases[0])],[...expected0]);
const unknown=decodeC2SOpcode62(new PacketWriter().writeI8(1).writeU8(7).writeU8(8).toUint8Array());
assert.equal(unknown.mode,1);assert.equal(unknown.fields,null);assert.deepEqual([...unknown.unconsumedBytes],[7,8]);
assert.throws(()=>encodeC2SOpcode62({mode:1}),/Unsupported C2S opcode 62 mode/);
const trailing=decodeC2SOpcode62(new PacketWriter().writeI8(5).writeU8(99).toUint8Array());
assert.deepEqual([...trailing.trailingBytes],[99]);
console.log("C2S opcode 62 command-variant codec: PASS (7 source-backed modes, unknown-mode preservation)");
