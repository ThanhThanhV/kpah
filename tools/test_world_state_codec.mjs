import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9, decodeS2COpcode12, decodeS2COpcode17, decodeS2COpcode7, decodeS2COpcode18, decodeS2COpcode19, decodeS2COpcode20, decodeS2COpcode21, decodeS2COpcode27, decodeS2COpcode28, decodeS2COpcode30, decodeS2COpcode32, decodeS2COpcode33, decodeS2COpcode2, decodeS2COpcode22, decodeS2COpcode23, decodeS2COpcode25, decodeS2COpcode26, decodeS2COpcode35, decodeS2COpcode64, decodeS2COpcodeMinus5, decodeS2COpcode37, decodeS2COpcode38, decodeS2COpcode39, decodeS2COpcodeMinus8, decodeS2COpcodeMinus9, decodeS2COpcodeMinus10, decodeS2COpcodeMinus11, decodeS2COpcodeMinus12, decodeS2COpcodeMinus17, decodeS2COpcodeMinus18, decodeS2COpcodeMinus19, decodeS2COpcodeMinus20, decodeS2COpcode61, decodeS2COpcode78 } from "../src/protocol/generated/world-state-codec.js";
const spawn=new PacketWriter().writeI8(1).writeU8(7).writeI16(123).writeI16(456).writeI16(789).writeI8(2)
 .writeI32(-99).writeI8(4).writeI8(5).writeBool(false)
 .writeI8(0).writeU8(8).writeI16(124).writeI16(500).writeI16(600).writeI8(1).writeI32(77).writeI8(6).writeBool(true).toUint8Array();
const s=decodeS2COpcode4(spawn);assert.equal(s.entities.length,2);assert.deepEqual(s.entities[0],{kind:1,templateId:7,entityId:123,x:456,y:789,state:2,extraInt:-99,kind1Subtype:4,marker:5,active:false});assert.equal(s.entities[1].kind1Subtype,0);assert.equal(s.entities[1].active,true);
const trunc=new PacketWriter().writeI8(0).writeU8(1).writeI16(2).writeI16(3).writeI16(4).writeI8(5).writeU8(0xaa).writeU8(0xbb).toUint8Array();
const st=decodeS2COpcode4(trunc);assert.equal(st.entities[0].extraInt,-1);assert.equal(st.entities[0].marker,-1);assert.equal(st.entities[0].active,true);
const combat6=decodeS2COpcode6(new PacketWriter().writeI16(10).writeI16(20).writeI8(3).writeI32(400).writeI32(900).writeI8(1).writeI8(2).writeI8(3).writeI8(4).toUint8Array());
assert.deepEqual(combat6,{firstEntityId:10,secondEntityId:20,actionByte:3,valueA:400,valueB:900,flagA:1,flagB:2,flagC:3,flagD:4,trailingBytes:new Uint8Array()});
const combat9=decodeS2COpcode9(new PacketWriter().writeI16(-10).writeI16(20).writeI8(4).writeI32(-400).writeI32(800).writeI8(5).writeI8(6).writeI8(7).writeI8(8).toUint8Array());
assert.equal(combat9.firstEntityId,-10);assert.equal(combat9.valueA,-400);assert.equal(combat9.flagD,8);
const despawn=decodeS2COpcode8(new PacketWriter().writeI16(10).writeI16(-20).toUint8Array());assert.deepEqual(despawn.entityIds,[10,-20]);
const map=decodeS2COpcode12(new PacketWriter().writeI16(1).writeI16(2).writeI16(3).writeI8(4).writeI16(5).writeUTF("Forest").writeBool(true).writeU8(0xaa).writeU8(0xbb).toUint8Array());
assert.equal(map.hfK,4);assert.equal(map.label,"Forest");assert.equal(map.hasMapData,true);assert.deepEqual([...map.mapData],[0xaa,0xbb]);
const noMap=decodeS2COpcode12(new PacketWriter().writeI16(1).writeI16(2).writeI16(3).writeI8(4).writeI16(5).writeUTF("Town").writeBool(false).toUint8Array());assert.equal(noMap.mapData,null);
console.log("Generated S2C world-state codec: PASS (spawn/update, despawn, map transition)");

const actionEvent=decodeS2COpcode17(new PacketWriter().writeI16(101).writeI16(202).writeI8(3).writeI32(450)
 .writeI8(2).writeI8(2)
 .writeI8(7).writeI16(1).writeI16(2).writeI16(3).writeI16(4)
 .writeI8(8).writeI16(-1).writeI16(-2).writeI16(-3).writeI16(-4)
 .writeI8(3).writeI8(99).writeI8(5).toUint8Array());
assert.equal(actionEvent.actorEntityId,101);assert.equal(actionEvent.targetEntityId,202);
assert.equal(actionEvent.eventByte,3);assert.equal(actionEvent.value,450);assert.equal(actionEvent.displayByte,2);
assert.deepEqual(actionEvent.effects,[{type:7,valueA:1,valueB:2,valueC:3,valueD:4},{type:8,valueA:-1,valueB:-2,valueC:-3,valueD:-4}]);
assert.equal(actionEvent.repeatCount,3);assert.equal(actionEvent.discardedByte,99);assert.equal(actionEvent.modeByte,5);
const actionNoTail=decodeS2COpcode17(new PacketWriter().writeI16(1).writeI16(2).writeI8(3).writeI32(4).writeI8(5).writeI8(0).toUint8Array());
assert.equal(actionNoTail.repeatCount,1);assert.equal(actionNoTail.discardedByte,null);assert.equal(actionNoTail.modeByte,0);
assert.throws(()=>decodeS2COpcode17(new PacketWriter().writeI16(1).writeI16(2).writeI8(3).writeI32(4).writeI8(5).writeI8(-1).toUint8Array()),/Negative opcode 17 effect count/);

const entityState=decodeS2COpcode7(new PacketWriter().writeI16(321).writeU8(255).writeI16(1200).writeI16(340)
 .writeI32(750).writeI8(-2).writeI8(3).writeI32(1000).writeI32(987654).toUint8Array());
assert.deepEqual(entityState,{entityId:321,templateId:255,x:1200,y:340,currentHp:750,stateByteD:-2,stateByteI:3,maxHp:1000,opaqueInt:987654,trailingBytes:new Uint8Array()});

const pickup18=decodeS2COpcode18(new PacketWriter().writeI16(55).writeI8(3).writeI16(700).writeI16(701)
 .writeI16(702).writeI8(-4).writeI8(5).writeI16(706).writeI16(707).toUint8Array());
assert.deepEqual(pickup18,{ownerCharacterId:55,sharedTypeByte:3,fieldK:700,itemId:701,fieldR:702,fieldSByte:-4,fieldYByte:5,fieldU:706,fieldV:707,trailingBytes:new Uint8Array()});
const reward19=decodeS2COpcode19(new PacketWriter().writeI16(55).writeI16(701).writeU8(0).writeI16(250).toUint8Array());
assert.deepEqual(reward19,{characterId:55,groundItemId:701,currencyOrItemIndex:0,amount:250,trailingBytes:new Uint8Array()});
const remove20=decodeS2COpcode20(new PacketWriter().writeI8(3).writeI16(701).toUint8Array());
assert.deepEqual(remove20,{entityKind:3,entityId:701,trailingBytes:new Uint8Array()});
const inventory21=decodeS2COpcode21(new PacketWriter().writeI16(900).writeI16(4).writeI8(-2).writeU16(60000)
 .writeI8(2).writeU8(7).writeI16(-8).writeU8(9).writeI16(10).writeI8(11).writeI8(-12).toUint8Array());
assert.deepEqual(inventory21,{itemId:900,fieldU:4,typeByteD:-2,unsignedValueW:60000,statCount:2,
 stats:[{statId:7,value:-8},{statId:9,value:10}],fieldS:11,optionalFieldC:-12,trailingBytes:new Uint8Array()});
const inventory21NoOptional=decodeS2COpcode21(new PacketWriter().writeI16(900).writeI16(4).writeI8(1).writeU16(2).writeI8(0).writeI8(3).toUint8Array());
assert.equal(inventory21NoOptional.optionalFieldC,0);

const chat27=decodeS2COpcode27(new PacketWriter().writeI16(321).writeUTF("Xin chào").toUint8Array());
assert.deepEqual(chat27,{entityId:321,message:"Xin chào",trailingBytes:new Uint8Array()});
const sold28=decodeS2COpcode28(new PacketWriter().writeI16(900).toUint8Array());
assert.equal(sold28.itemId,900);
const exp30=decodeS2COpcode30(new PacketWriter().writeI16(321).writeI16(1234).writeI32(500).toUint8Array());
assert.deepEqual(exp30,{characterId:321,experienceValue:1234,experienceGain:500,trailingBytes:new Uint8Array()});
const resource32=decodeS2COpcode32(new PacketWriter().writeI16(321).writeI8(2).writeUTF("hp").writeI32(1000).writeUTF("mp").writeI32(250).toUint8Array());
assert.equal(resource32.stats[0].key,"hp");assert.equal(resource32.stats[1].value,250);assert.equal(resource32.localStateByte,null);
const local32=decodeS2COpcode32(new PacketWriter().writeI16(321).writeI8(0).writeI8(4).writeI16(50).toUint8Array(),true);
assert.equal(local32.localStateByte,4);assert.equal(local32.localShortValue,50);
assert.throws(()=>decodeS2COpcode32(new PacketWriter().writeI16(321).writeI8(-1).toUint8Array()),/Negative opcode 32 stat count/);
const level33=decodeS2COpcode33(new PacketWriter().writeI16(321).writeI8(12).writeI32(10000).writeI32(2000).toUint8Array());
assert.deepEqual(level33,{characterId:321,level:12,valueA:10000,valueB:2000,trailingBytes:new Uint8Array()});

const drop61=decodeS2COpcode61(new PacketWriter().writeI16(321).writeI16(900).writeI8(7).writeI8(-2)
 .writeI16(11).writeI16(12).writeI16(13).toUint8Array());
assert.deepEqual(drop61,{characterId:321,itemId:900,effectType:7,effectFieldByte:-2,effectShortC:11,effectShortD:12,effectShortE:13,trailingBytes:new Uint8Array()});
const warehouse78=decodeS2COpcode78(new PacketWriter().writeI16(901).toUint8Array());
assert.equal(warehouse78.warehouseItemId,901);

const variant230=decodeS2COpcode23(new PacketWriter().writeI8(0).writeI8(3).writeU8(1).writeU8(2).writeU8(255).toUint8Array());
assert.deepEqual([...variant230.subtype0Bytes],[1,2,255]);
const variant231=decodeS2COpcode23(new PacketWriter().writeI8(1).writeI8(-1).writeI16(2).writeI16(10).writeI16(11).toUint8Array());
assert.equal(variant231.categoryByte,-1);assert.deepEqual(variant231.itemIds,[10,11]);assert.equal(variant231.modeByte,2);
const variant231Mode=decodeS2COpcode23(new PacketWriter().writeI8(1).writeI8(4).writeI16(0).writeI8(7).toUint8Array());
assert.equal(variant231Mode.modeByte,7);
const variant232=decodeS2COpcode23(new PacketWriter().writeI8(2).writeI8(1).writeI8(3).writeI16(50).writeI16(-2)
 .writeI8(-4).writeI8(5).writeI16(6).writeI16(7).toUint8Array());
assert.deepEqual(variant232.subtype2Items[0],{itemType:3,itemId:50,rawValue:-2,normalizedValue:254,fieldSByte:-4,fieldYByte:5,fieldV:6,fieldU:7});
const variant233=decodeS2COpcode23(new PacketWriter().writeI8(3).toUint8Array());
assert.equal(variant233.trailingBytes.length,0);
const variant234=decodeS2COpcode23(new PacketWriter().writeI8(4).writeI8(2).writeU8(8).writeU8(9).writeI8(-1).writeI8(3).toUint8Array());
assert.deepEqual([...variant234.subtype4Bytes],[8,9]);assert.deepEqual(variant234.subtype4Trailer,[-1,3]);
assert.throws(()=>decodeS2COpcode23(new PacketWriter().writeI8(0).writeI8(-1).toUint8Array()),/Negative opcode 23 subtype 0 count/);

const catalog25Writer=new PacketWriter().writeU8(1).writeU8(7).writeUTF("lookup").writeI8(-1).writeI8(2)
 .writeI8(1).writeI16(100).writeI16(200);
for(let i=0;i<5;i++)catalog25Writer.writeI8(i-2);
catalog25Writer.writeI16(1).writeI16(0).writeUTF("Sword9");
for(let i=0;i<5;i++)catalog25Writer.writeI8(i);
catalog25Writer.writeI16(88);
for(let i=0;i<10;i++)catalog25Writer.writeI16(i-5);
catalog25Writer.writeI32(123456).writeI8(-6).writeI8(7).writeI16(8).writeI16(9);
catalog25Writer.writeI16(1).writeI16(22).writeI8(-3).writeI32(456).writeUTF("item1").writeUTF("desc")
 .writeI8(4).writeBool(true).writeI8(-5).writeI8(6);
catalog25Writer.writeU8(1).writeU8(23).writeU8(24).writeI32(789).writeUTF("shop").writeUTF("detail")
 .writeI8(-7).writeI8(8).writeBool(false).writeI16(90);
const catalog25=decodeS2COpcode25(catalog25Writer.toUint8Array());
assert.equal(catalog25.lookupRecords[0].id,7);assert.equal(catalog25.coordinatePairs[0].y,200);
assert.equal(catalog25.definitions[0].name,"Sword9");assert.equal(catalog25.definitions[0].valuesL.length,10);
assert.equal(catalog25.signedList[0].textK,"desc");assert.equal(catalog25.unsignedList[0].id,23);
assert.equal(catalog25.unsignedList[0].shortM,90);

const message2=decodeS2COpcode2(new PacketWriter().writeUTF("2shop").writeI8(2).writeUTF("Potion").writeI16(101).writeUTF("Restore HP").writeUTF("Sword").writeI16(202).writeUTF("Weapon").toUint8Array());
assert.equal(message2.variant,"options");assert.equal(message2.selector,"shop");assert.equal(message2.options[1].value,202);
const provider2=decodeS2COpcode2(new PacketWriter().writeUTF("3").writeUTF("provider-x").writeUTF("agent-y").toUint8Array());
assert.equal(provider2.variant,"provider-agent");assert.equal(provider2.provider,"provider-x");assert.equal(provider2.agent,"agent-y");
const plain2=decodeS2COpcode2(new PacketWriter().writeUTF("Server maintenance").toUint8Array());
assert.equal(plain2.variant,"server-message");assert.equal(plain2.message,"Server maintenance");
assert.throws(()=>decodeS2COpcode2(new PacketWriter().writeUTF("2bad").writeI8(-1).toUint8Array()),/Negative opcode 2 option count/);
const aux22=decodeS2COpcode22(new PacketWriter().writeI16(12).writeI8(-3).writeI16(34).writeI32(5678).writeI8(9).toUint8Array());
assert.deepEqual([aux22.firstShort,aux22.typeByte,aux22.secondShort,aux22.valueInt,aux22.optionalByte],[12,-3,34,5678,9]);
const aux22Default=decodeS2COpcode22(new PacketWriter().writeI16(1).writeI8(2).writeI16(3).writeI32(4).toUint8Array());
assert.equal(aux22Default.optionalByte,0);

const resource26Writer=new PacketWriter().writeU8(3).writeI16(3).writeU8(1).writeU8(2).writeU8(255)
 .writeU8(1).writeI16(2).writeU8(10).writeU8(11)
 .writeU8(1).writeI16(42).writeI16(2).writeU8(12).writeU8(13)
 .writeI16(1).writeI16(43).writeI16(2).writeU8(14).writeU8(15)
 .writeI8(1).writeI8(1).writeI8(2).writeI8(3).writeI8(4).writeI8(-1).writeI8(-2).writeI8(-3).writeI8(-4);
for(const values of [[1,2],[3],[4],[5],[6,7],[8]]){resource26Writer.writeI8(values.length);for(const v of values)resource26Writer.writeI8(v);}
const resource26=decodeS2COpcode26(resource26Writer.toUint8Array());
assert.equal(resource26.templateCount,3);assert.deepEqual([...resource26.primaryData],[1,2,255]);
assert.deepEqual([...resource26.effectData[0]],[10,11]);assert.equal(resource26.indexedImages[0].id,42);
assert.equal(resource26.indexedGraphics[0].id,43);assert.deepEqual([...resource26.ct[0]],[1,2,3,4]);
assert.deepEqual([...resource26.cu[0]],[255,254,253,252]);assert.deepEqual([...resource26.cv[0]],[1,2]);
assert.deepEqual([...resource26.cw[0]],[4]);assert.deepEqual([...resource26.cx[1]],[8]);assert.equal(resource26.sectionErrors.length,0);
assert.throws(()=>decodeS2COpcode26(new PacketWriter().writeU8(1).writeI16(-1).toUint8Array()),/Negative resource blob length/);
const resource26Fallback=decodeS2COpcode26(new PacketWriter().writeU8(0).writeI16(0).writeU8(0).writeU8(0).writeI16(0).writeI8(-1).toUint8Array());
assert.deepEqual([...resource26Fallback.ct[0]],[0,0,7,249]);assert.deepEqual([...resource26Fallback.cu[0]],[236,241,241,241]);

const grid35Writer=new PacketWriter();
for(let i=0;i<165;i++)grid35Writer.writeI16(i-82);
for(let i=0;i<165;i++)grid35Writer.writeI16(i-80);
for(let i=0;i<15;i++)grid35Writer.writeI16(i+1);
for(let i=0;i<165;i++)grid35Writer.writeU8(i%256);
for(let i=0;i<165;i++)grid35Writer.writeI16(200-i);
for(let i=0;i<165;i++)grid35Writer.writeI8((i%127)-63);
for(let i=0;i<5;i++){grid35Writer.writeI8(i);for(let j=0;j<i;j++)grid35Writer.writeI8(j+1);}
const grid35=decodeS2COpcode35(grid35Writer.toUint8Array());
assert.equal(grid35.shortGrid.length,15);assert.equal(grid35.shortGrid[0].length,11);
assert.equal(grid35.shortGrid[0][0],-82);assert.equal(grid35.scaledGrid[0][0],-8000);
assert.equal(grid35.rowShorts[14],15);assert.equal(grid35.unsignedGrid[14][10],164);
assert.equal(grid35.secondaryShortGrid[0][0],200);assert.equal(grid35.signedByteGrid[0][0],-63);
assert.equal(grid35.extraArrays.length,5);assert.deepEqual([...grid35.extraArrays[4]],[1,2,3,4]);
const skill64=decodeS2COpcode64(new PacketWriter().writeI8(1).writeI8(-1).writeI8(2).writeI16(300).writeI16(-400).writeI16(500).toUint8Array());
assert.deepEqual(skill64.records[0],{byteA:-1,byteB:2,shortC:300,shortD:-400,shortE:500});
const chat5=decodeS2COpcodeMinus5(new PacketWriter().writeI8(2).writeUTF("Alice").writeUTF("Hello").writeUTF("Bob").writeUTF("Xin chào").toUint8Array());
assert.equal(chat5.messages[1].message,"Xin chào");
const dialog37=decodeS2COpcode37(new PacketWriter().writeUTF("Title").writeUTF("Body").toUint8Array());
assert.equal(dialog37.dialogBody,"Body");
const notice38=decodeS2COpcode38(new PacketWriter().writeUTF("World notice").toUint8Array());
assert.equal(notice38.noticeText,"World notice");
const sms39=decodeS2COpcode39(new PacketWriter().writeUTF("123").writeBool(true).writeUTF("Register").writeUTF("sms://1234").toUint8Array());
assert.equal(sms39.success,true);assert.equal(sms39.smsDestination,"sms://1234");

const resource8=decodeS2COpcodeMinus8(new PacketWriter().writeI8(2).writeI8(-3).writeI16(2).writeU8(1).writeU8(2)
 .writeI16(1).writeU8(3).writeU8(1).writeI16(2).writeU8(4).writeU8(5)
 .writeI8(1).writeI16(1).writeU8(7).toUint8Array());
assert.equal(resource8.subtype,2);assert.deepEqual([...resource8.primaryData],[1,2]);
assert.deepEqual([...resource8.secondaryData],[3]);assert.deepEqual([...resource8.groups[0].data],[4,5]);
assert.deepEqual([...resource8.groups[0].nested[0]],[7]);
const resource8Image=decodeS2COpcodeMinus8(new PacketWriter().writeI8(4).writeI8(1).writeI16(2).writeU8(8).writeU8(9).toUint8Array());
assert.deepEqual([...resource8Image.primaryData],[8,9]);
const list9=decodeS2COpcodeMinus9(new PacketWriter().writeI16(2).writeI16(10).writeI16(-20).writeUTF("done").toUint8Array());
assert.deepEqual(list9.ids,[10,-20]);assert.equal(list9.message,"done");
const panel10=decodeS2COpcodeMinus10(new PacketWriter().writeI16(33).writeUTF("updated").toUint8Array());
assert.equal(panel10.id,33);assert.equal(panel10.message,"updated");
const confirm11=decodeS2COpcodeMinus11(new PacketWriter().writeI8(0).writeI16(44).writeUTF("confirm").toUint8Array());
assert.equal(confirm11.id,44);assert.equal(confirm11.success,null);
const result11=decodeS2COpcodeMinus11(new PacketWriter().writeI8(1).writeUTF("ok").writeBool(true).writeI16(5).writeI16(6).toUint8Array());
assert.equal(result11.firstShort,5);assert.equal(result11.secondShort,6);
const social12=decodeS2COpcodeMinus12(new PacketWriter().writeI16(1).writeUTF("n").writeUTF("d").writeI8(-2).writeI16(3)
 .writeI64(4).writeI64(5).writeI64(6).writeUTF("a").writeUTF("b").writeBool(true).writeI8(7).writeUTF("extra").toUint8Array());
assert.equal(social12.longC,6n);assert.equal(social12.extraText,"extra");
const announcements17=decodeS2COpcodeMinus17(new PacketWriter().writeI16(1).writeI32(99).writeUTF("title").writeUTF("message").toUint8Array());
assert.equal(announcements17.records[0].id,99);
assert.equal(decodeS2COpcodeMinus18(new PacketWriter().writeUTF("guild chat").toUint8Array()).message,"guild chat");
const ranking19=decodeS2COpcodeMinus19(new PacketWriter().writeI8(5).writeUTF("Top guild").writeI16(1).writeI16(7).writeUTF("guild").writeUTF("desc").writeI8(2).writeI16(3).writeI64(4).writeI8(5).toUint8Array());
assert.equal(ranking19.records[0].longValue,4n);assert.equal(ranking19.opaqueRankingPayload.length,0);
const otherRanking19=decodeS2COpcodeMinus19(new PacketWriter().writeI8(4).writeUTF("Top").writeU8(1).writeU8(2).toUint8Array());
assert.deepEqual([...otherRanking19.opaqueRankingPayload],[1,2]);
assert.equal(decodeS2COpcodeMinus20(new PacketWriter().writeI32(12345).toUint8Array()).amount,12345);
