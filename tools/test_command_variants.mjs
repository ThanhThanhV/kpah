import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { C2S_OPCODE62_MODES, encodeC2SOpcode62, decodeC2SOpcode62, encodeC2SOpcode94, decodeC2SOpcode94, C2S_OPCODE24_VARIANTS, encodeC2SOpcode24, decodeC2SOpcode24, encodeC2SOpcode74, decodeC2SOpcode74 } from "../src/protocol/generated/command-variant-codec.js";
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

const market94Cases=[{mode:0,fieldByteA:-1,fieldByteB:2},{mode:1,fieldByteA:3,fieldByteB:-4,fieldShort:1200}];
for(const values of market94Cases){const encoded=encodeC2SOpcode94(values),decoded=decodeC2SOpcode94(encoded);const {mode,...fields}=values;assert.equal(decoded.mode,mode);assert.deepEqual(decoded.fields,fields);}
const market94Unknown=decodeC2SOpcode94(new PacketWriter().writeI8(2).writeU8(10).toUint8Array());
assert.equal(market94Unknown.fields,null);assert.deepEqual([...market94Unknown.unconsumedBytes],[10]);
assert.throws(()=>encodeC2SOpcode94({mode:2}),/Unsupported C2S opcode 94 mode/);

assert.deepEqual(C2S_OPCODE24_VARIANTS, ["catalog", "category4_fixed"]);
const catalogRecords = [
 {category:3,templateId:0x1234,optionByte:7},
 {category:1,templateId:0x0022}
];
const catalogPayload = encodeC2SOpcode24("catalog",{records:catalogRecords});
assert.deepEqual([...catalogPayload],[2,3,0x12,0x34,0,1,7,1,0,0x22,0,1]);
const catalogDecoded = decodeC2SOpcode24("catalog",catalogPayload);
assert.deepEqual(catalogDecoded.records,[
 {category:3,templateId:0x1234,quantity:1,optionByte:7},
 {category:1,templateId:0x0022,quantity:1}
]);
const premiumPayload = encodeC2SOpcode24("category4_fixed",{records:[{itemId:0x0102,quantity:5}]});
assert.deepEqual([...premiumPayload],[1,4,1,2,0,5]);
assert.deepEqual(decodeC2SOpcode24("category4_fixed",premiumPayload).records,[
 {category:4,itemId:0x0102,quantity:5}
]);
assert.throws(()=>encodeC2SOpcode24("unknown",{records:[]}),/Unknown C2S opcode 24 variant/);
assert.throws(()=>encodeC2SOpcode24("catalog",{records:[{category:3,templateId:1}]}),/Missing opcode 24 field optionByte/);
assert.throws(()=>encodeC2SOpcode24("catalog",{records:Array.from({length:256},()=>({category:1,templateId:1}))}),/exceeds u8/);
const catalogTrailing = decodeC2SOpcode24("category4_fixed",new PacketWriter().writeU8(0).writeU8(99).toUint8Array());
assert.deepEqual([...catalogTrailing.trailingBytes],[99]);

const shop74Payload = encodeC2SOpcode74({itemIds:[0x1234,-2]});
assert.deepEqual([...shop74Payload],[0,2,0x12,0x34,0xff,0xfe]);
assert.deepEqual(decodeC2SOpcode74(shop74Payload).itemIds,[0x1234,-2]);
assert.deepEqual([...encodeC2SOpcode74({itemIds:[]})],[0,0]);
assert.throws(()=>encodeC2SOpcode74({itemIds:Array(32768).fill(1)}),/exceeds signed short/);
assert.throws(()=>decodeC2SOpcode74(new PacketWriter().writeI16(-1).toUint8Array()),/Negative opcode 74 item count/);
console.log("C2S opcodes 24/74 shop batch codecs: PASS (caller-selected variants, conditional fields, expanded item list)");
