import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9, decodeS2COpcode12, decodeS2COpcode17, decodeS2COpcode7, decodeS2COpcode18, decodeS2COpcode19, decodeS2COpcode20, decodeS2COpcode21, decodeS2COpcode27, decodeS2COpcode28, decodeS2COpcode30, decodeS2COpcode32, decodeS2COpcode33, decodeS2COpcode2, decodeS2COpcode22, decodeS2COpcode23, decodeS2COpcode25, decodeS2COpcode26, decodeS2COpcode35, decodeS2COpcode64, decodeS2COpcodeMinus5, decodeS2COpcode37, decodeS2COpcode38, decodeS2COpcode39, decodeS2COpcodeMinus8, decodeS2COpcodeMinus9, decodeS2COpcodeMinus10, decodeS2COpcodeMinus11, decodeS2COpcodeMinus12, decodeS2COpcodeMinus17, decodeS2COpcodeMinus18, decodeS2COpcodeMinus19, decodeS2COpcodeMinus20, decodeS2COpcodeMinus22, decodeS2COpcode105, decodeS2COpcodeMinus27, decodeS2COpcodeMinus43, decodeS2COpcodeMinus38, decodeS2COpcodeMinus39, decodeS2COpcodeMinus42, decodeS2COpcodeMinus24, decodeS2COpcodeMinus26, decodeS2COpcodeMinus28, decodeS2COpcodeMinus30, decodeS2COpcodeMinus31, decodeS2COpcodeMinus32, decodeS2COpcodeMinus33, decodeS2COpcodeMinus37, decodeS2COpcodeMinus50, decodeS2COpcodeMinus52, decodeS2COpcodeMinus59, decodeS2COpcodeMinus46, decodeS2COpcodeMinus47, decodeS2COpcodeMinus48, decodeS2COpcodeMinus49, decodeS2COpcodeMinus51, decodeS2COpcodeMinus56, decodeS2COpcodeMinus57, decodeS2COpcodeMinus55, decodeS2COpcodeMinus60, decodeS2COpcodeMinus61, decodeS2COpcodeMinus62, decodeS2COpcodeMinus63, decodeS2COpcodeMinus65, decodeS2COpcodeMinus41, decodeS2COpcode58, decodeS2COpcode13, decodeS2COpcode15, decodeS2COpcode61, decodeS2COpcode78 } from "../src/protocol/generated/world-state-codec.js";
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

const petContextWriter=new PacketWriter().writeI8(0).writeUTF("Pet A").writeI8(2).writeI8(3).writeI8(1);
petContextWriter.writeI8(2).writeI16(101).writeI8(3).writeI8(4).writeI16(5).writeI8(6);
for(let i=0;i<5;i++)petContextWriter.writeI16(10+i);for(let i=0;i<5;i++)petContextWriter.writeI8(7+i);
petContextWriter.writeUTF("Pet gear");for(let i=0;i<10;i++)petContextWriter.writeI8(20+i);for(let i=0;i<3;i++)petContextWriter.writeI8(30+i);for(let i=0;i<15;i++)petContextWriter.writeI8(40+i);
petContextWriter.writeI16(200).writeI8(-2);for(let i=0;i<5;i++)petContextWriter.writeI16(60+i);petContextWriter.writeI8(-1);
const petContext=decodeS2COpcodeMinus22(petContextWriter.toUint8Array());
assert.equal(petContext.variant,"pet-context");assert.equal(petContext.petName,"Pet A");assert.equal(petContext.items[0].itemId,101);
assert.equal(petContext.items[0].appearanceA.length,10);assert.equal(petContext.items[0].appearanceC.length,3);assert.equal(petContext.items[0].appearanceB.length,15);
assert.equal(petContext.petExtraShorts[4],64);
const petImageWriter=new PacketWriter().writeI8(1).writeI8(1);
petImageWriter.writeI8(3).writeI16(501).writeI16(502).writeI8(-4).writeI8(5).writeI16(6).writeI16(7).writeI8(8);
for(let i=0;i<5;i++)petImageWriter.writeI16(20+i);for(let i=0;i<5;i++)petImageWriter.writeI8(9+i);
petImageWriter.writeUTF("Compact gear");for(let i=0;i<10;i++)petImageWriter.writeI8(50+i);for(let i=0;i<3;i++)petImageWriter.writeI8(60+i);for(let i=0;i<15;i++)petImageWriter.writeI8(70+i);
petImageWriter.writeI8(3).writeU8(90).writeU8(91).writeU8(92);
const petImage=decodeS2COpcodeMinus22(petImageWriter.toUint8Array());
assert.equal(petImage.variant,"pet-equipment-image");assert.equal(petImage.items[0].itemV,6);assert.equal(petImage.imageFrameCount,3);assert.deepEqual([...petImage.imageBytes],[90,91,92]);
const petUnavailable=decodeS2COpcodeMinus22(new PacketWriter().writeI8(1).writeI8(-1).toUint8Array());
assert.equal(petUnavailable.variant,"no-information");

const lookup105Writer=new PacketWriter().writeI8(2).writeI8(1).writeI8(2);
for(let row=0;row<2;row++){for(let i=0;i<6;i++){lookup105Writer.writeI16(row*10+i);if(i%3===0)lookup105Writer.writeUTF("label-"+row+"-"+i);}}
lookup105Writer.writeI8(1).writeI16(70).writeI16(71).writeI16(72).writeI8(1);
for(let i=0;i<6;i++){lookup105Writer.writeI16(80+i);if(i%3===0)lookup105Writer.writeUTF("third-"+i);}
const lookup105=decodeS2COpcode105(lookup105Writer.toUint8Array());
assert.equal(lookup105.rowWidth,2);assert.equal(lookup105.firstGroups[0].length,2);
assert.equal(lookup105.firstGroups[0][1].values[5],15);assert.equal(lookup105.firstGroups[0][0].labels[1],"label-0-3");
assert.equal(lookup105.secondGroups[0].values[1],71);assert.equal(lookup105.secondGroups[0].trailingValue,72);
assert.equal(lookup105.thirdGroups[0].labels[1],"third-3");
assert.throws(()=>decodeS2COpcode105(new PacketWriter().writeI8(-1).toUint8Array()),/Negative opcode 105 row width/);

const portrait27=decodeS2COpcodeMinus27(new PacketWriter().writeI8(1).writeI8(2).writeI16(2).writeU8(10).writeU8(11).writeI16(3).writeU8(20).writeU8(21).writeU8(22).writeI8(4).writeI8(5).toUint8Array());
assert.deepEqual([...portrait27.firstImage],[10,11]);assert.deepEqual([...portrait27.secondImage],[20,21,22]);
assert.equal(portrait27.targetSelector,1);assert.equal(portrait27.metadataB,5);
const portraitEmpty=decodeS2COpcodeMinus27(new PacketWriter().writeI8(0).writeI8(-1).toUint8Array());
assert.equal(portraitEmpty.firstImage,null);
const sprites43=decodeS2COpcodeMinus43(new PacketWriter().writeI8(1).writeI32(3).writeU8(1).writeU8(2).writeU8(3)
 .writeI8(1).writeI8(0).writeI8(2).writeI8(-3).writeI8(4).writeI8(5).writeI8(6).toUint8Array());
assert.deepEqual([...sprites43.images[0]],[1,2,3]);assert.equal(sprites43.objects[0].xPixels,32);assert.equal(sprites43.objects[0].yPixels,-48);
const spritesEmpty=decodeS2COpcodeMinus43(new PacketWriter().writeI8(0).toUint8Array());
assert.equal(spritesEmpty.objects,null);

const markers38=decodeS2COpcodeMinus38(new PacketWriter().writeBool(true).writeI8(1).writeI16(10).writeI16(20).writeUTF("npc").writeUTF("quest").toUint8Array());
assert.equal(markers38.enabled,true);assert.equal(markers38.records[0].entityId,20);assert.equal(markers38.records[0].marker,"quest");
const counter39=decodeS2COpcodeMinus39(new PacketWriter().writeI8(-2).writeI16(321).writeI32(98765).toUint8Array());
assert.deepEqual([counter39.typeByte,counter39.entityId,counter39.counter],[-2,321,98765]);
const pairs42=decodeS2COpcodeMinus42(new PacketWriter().writeI16(77).writeI8(-1).writeI8(2).writeI8(3).writeI8(-4).toUint8Array());
assert.equal(pairs42.contextId,77);assert.deepEqual(pairs42.pairs,[[-1,2],[3,-4]]);
assert.throws(()=>decodeS2COpcodeMinus42(new PacketWriter().writeI16(1).writeI8(2).toUint8Array()),/Odd opcode -42 byte-pair payload length/);

const notice24=decodeS2COpcodeMinus24(new PacketWriter().writeI8(0).writeUTF("event").toUint8Array());
assert.equal(notice24.action,0);assert.equal(notice24.text,"event");
assert.equal(decodeS2COpcodeMinus26(new PacketWriter().writeUTF("entity label").toUint8Array()).text,"entity label");
const binary28=decodeS2COpcodeMinus28(new PacketWriter().writeI16(3).writeU8(1).writeU8(2).writeU8(3).toUint8Array());
assert.deepEqual([...binary28.data],[1,2,3]);
const options30=decodeS2COpcodeMinus30(new PacketWriter().writeI16(10).writeI8(2).writeI8(2).writeUTF("one").writeUTF("two").toUint8Array());
assert.deepEqual(options30.options,["one","two"]);
const text31=decodeS2COpcodeMinus31(new PacketWriter().writeI16(11).writeI8(3).writeUTF("detail").writeI8(-1).toUint8Array());
assert.equal(text31.option,-1);
const confirm32=decodeS2COpcodeMinus32(new PacketWriter().writeI16(12).writeI8(4).writeUTF("confirm").toUint8Array());
assert.equal(confirm32.text,"confirm");

const mapMarker33=decodeS2COpcodeMinus33(new PacketWriter().writeI8(-2).writeI8(3).writeI16(44).toUint8Array());
assert.deepEqual([mapMarker33.rawX,mapMarker33.rawY,mapMarker33.xPixels,mapMarker33.yPixels,mapMarker33.mapId],[-2,3,-32,48,44]);
const quest370=decodeS2COpcodeMinus37(new PacketWriter().writeI8(0).writeUTF("quest").writeI8(0).writeI8(2).writeI16(10).writeI16(7).writeUTF("remain").toUint8Array());
assert.deepEqual([quest370.resultType,quest370.subtype,quest370.total,quest370.completedOrClaimed,quest370.trailingText],[0,0,10,7,"remain"]);
const quest371=decodeS2COpcodeMinus37(new PacketWriter().writeI8(0).writeUTF("quest").writeI8(1).writeI8(-1).writeI16(5).writeI16(2).writeUTF("claimed").toUint8Array());
assert.deepEqual([quest371.subtype,quest371.progressByte,quest371.completedOrClaimed],[1,-1,2]);
const quest372=decodeS2COpcodeMinus37(new PacketWriter().writeI8(0).writeUTF("quest").writeI8(2).writeI8(9).writeUTF("plot").toUint8Array());
assert.equal(quest372.plotId,9);
assert.equal(decodeS2COpcodeMinus37(new PacketWriter().writeI8(1).writeUTF("notice").toUint8Array()).text,"notice");
const questMessage=decodeS2COpcodeMinus37(new PacketWriter().writeI8(2).writeUTF("title").writeUTF("body").toUint8Array());
assert.deepEqual([questMessage.title,questMessage.text],["title","body"]);

const entityLabel50=decodeS2COpcodeMinus50(new PacketWriter().writeUTF("quest npc")
 .writeI16(1).writeI16(2).writeI16(3).writeI16(4).writeI16(5).writeI16(6).writeI8(-1).writeI8(7).toUint8Array());
assert.deepEqual([entityLabel50.label,entityLabel50.shortFields,entityLabel50.byteFields],["quest npc",[1,2,3,4,5,6],[-1,7]]);
const choices52=decodeS2COpcodeMinus52(new PacketWriter().writeUTF("npc menu").writeI16(99).writeI8(2)
 .writeUTF("talk").writeI16(10).writeI8(1).writeUTF("trade").writeI16(11).writeI8(2).writeI8(1).toUint8Array());
assert.equal(choices52.choices.length,2);assert.equal(choices52.selectedIndex,1);assert.equal(choices52.mode,0);
const choices52Mode=decodeS2COpcodeMinus52(new PacketWriter().writeUTF("menu").writeI16(1).writeI8(0).writeI8(-1).writeI8(4).toUint8Array());
assert.equal(choices52Mode.mode,4);
const npc59=decodeS2COpcodeMinus59(new PacketWriter().writeI8(1).writeI8(2).writeI8(-3).writeUTF("npc").writeI8(4)
 .writeI32(500).writeI8(-2).writeI8(3).writeBool(true).writeI8(5).writeI8(6).toUint8Array());
assert.deepEqual([npc59.records[0].name,npc59.records[0].xPixels,npc59.records[0].yPixels,npc59.records[0].enabled],["npc",-32,48,true]);

const resource46a=decodeS2COpcodeMinus46(new PacketWriter().writeI8(0).writeUTF("resource ready").writeI8(-2).toUint8Array());
assert.deepEqual([resource46a.variant,resource46a.text,resource46a.value],[0,"resource ready",-2]);
const resource46b=decodeS2COpcodeMinus46(new PacketWriter().writeI8(1).writeI8(-3).writeI8(4).writeU8(8).writeU8(9).toUint8Array());
assert.deepEqual([resource46b.fieldA,resource46b.fieldB,[...resource46b.opaqueBytes]],[-3,4,[8,9]]);
const resource47=decodeS2COpcodeMinus47(new PacketWriter().writeI16(12).writeBool(true).writeI16(3).writeU8(1).writeU8(2).writeU8(3).toUint8Array());
assert.deepEqual([resource47.slotId,resource47.flag,[...resource47.blob]],[12,true,[1,2,3]]);
const resource48a=decodeS2COpcodeMinus48(new PacketWriter().writeI8(2).writeI16(2).writeU8(5).writeU8(6).toUint8Array());
assert.deepEqual([resource48a.target,[...resource48a.blob]],[2,[5,6]]);
const resource48b=decodeS2COpcodeMinus48(new PacketWriter().writeI8(-1).writeI8(7).writeI8(-8).writeU8(9).toUint8Array());
assert.deepEqual([resource48b.target,resource48b.fieldA,resource48b.fieldB,[...resource48b.opaqueBytes]],[-1,7,-8,[9]]);

const animation49=decodeS2COpcodeMinus49(new PacketWriter().writeI8(0).writeI8(7).writeI8(1).writeI8(2).writeI16(30).writeI8(2)
 .writeI8(1).writeI16(-4).writeI16(5).writeI16(9).writeI16(10).toUint8Array());
assert.deepEqual([animation49.assetId,animation49.phase,animation49.mode,animation49.offsets,animation49.origin],
 [7,1,2,[[-4,5]],{first:9,second:10}]);
const asset49=new PacketWriter().writeI8(1).writeI8(8).writeI16(2).writeU8(1).writeU8(2)
 .writeI8(1).writeI8(3).writeI8(4).writeI8(5).writeI8(6).writeI8(7)
 .writeI8(1).writeI8(1).writeI8(8).writeI8(9).writeI8(10)
 .writeI8(2).writeI8(11).writeI8(12).toUint8Array();
const asset49Decoded=decodeS2COpcodeMinus49(asset49);
assert.deepEqual([...asset49Decoded.imageBytes],[1,2]);assert.equal(asset49Decoded.descriptors[0].b,7);
assert.deepEqual(asset49Decoded.groups[0].triples,[[8,9,10]]);assert.deepEqual(asset49Decoded.finalBytes,[11,12]);
const image51=decodeS2COpcodeMinus51(new PacketWriter().writeI16(77).writeU8(1).writeU8(2).writeU8(3).toUint8Array());
assert.deepEqual([image51.resourceId,[...image51.imageBytes]],[77,[1,2,3]]);

const companion56=decodeS2COpcodeMinus56(new PacketWriter().writeI8(1).writeI16(7).writeI8(-2).writeUTF("pet A").writeI8(3)
 .writeI8(1).writeI16(8).writeI8(4).writeUTF("pet B").writeI8(-5).toUint8Array());
assert.equal(companion56.first.records[0].label,"pet A");assert.equal(companion56.second.records[0].fieldE,-5);
const companionState57=decodeS2COpcodeMinus57(new PacketWriter().writeI8(0).writeBool(true).writeI16(123).writeI8(4).toUint8Array());
assert.deepEqual([companionState57.enabled,companionState57.entityId,companionState57.companionType],[true,123,4]);
const companionSpriteWriter=new PacketWriter().writeI8(1).writeI8(2).writeI16(2).writeU8(9).writeU8(8);
for(let g=0;g<3;g++)companionSpriteWriter.writeI8(1).writeI8(g).writeI8(g+1).writeI8(g+2).writeI8(g+3);
companionSpriteWriter.writeI8(-1).writeI8(5);
const companionSprite57=decodeS2COpcodeMinus57(companionSpriteWriter.toUint8Array());
assert.deepEqual([companionSprite57.imageSlot,[...companionSprite57.imageBytes],companionSprite57.frameGroups.length,
 companionSprite57.frameGroups[2].tuples[0],companionSprite57.offsetA,companionSprite57.offsetB],
 [2,[9,8],3,[2,3,4,5],-1,5]);

const objects55=decodeS2COpcodeMinus55(new PacketWriter().writeI8(1).writeI8(3).writeI16(10).writeI16(20).writeI16(30).writeI16(40).toUint8Array());
assert.deepEqual(objects55.records[0],{type:3,firstShort:10,secondShort:20,thirdShort:30,fourthShort:40});
assert.equal(decodeS2COpcodeMinus60(new PacketWriter().writeUTF("world notice").toUint8Array()).text,"world notice");
const marker61=decodeS2COpcodeMinus61(new PacketWriter().writeI8(1).writeI8(-2).writeI8(3).writeI16(400).writeI8(5).toUint8Array());
assert.deepEqual([marker61.firstByte,marker61.secondByte,marker61.thirdByte,marker61.shortValue,marker61.fifthByte,marker61.optionalByte],[1,-2,3,400,5,0]);
const marker61Optional=decodeS2COpcodeMinus61(new PacketWriter().writeI8(1).writeI8(2).writeI8(3).writeI16(4).writeI8(5).writeI8(-6).toUint8Array());
assert.equal(marker61Optional.optionalByte,-6);

const lucky62Init=decodeS2COpcodeMinus62(new PacketWriter().writeI8(0).writeI8(5).writeI8(2).writeUTF("box A").writeUTF("box B").toUint8Array());
assert.deepEqual([lucky62Init.boxCount,lucky62Init.labels],[5,["box A","box B"]]);
const lucky62Result=decodeS2COpcodeMinus62(new PacketWriter().writeI8(1).writeI8(3).writeUTF("selected").writeI8(2).writeUTF("open").writeUTF("close").toUint8Array());
assert.deepEqual([lucky62Result.selectedBox,lucky62Result.text,lucky62Result.options],[3,"selected",["open","close"]]);
assert.equal(decodeS2COpcodeMinus62(new PacketWriter().writeI8(2).toUint8Array()).resultType,2);
const grid63=decodeS2COpcodeMinus63(new PacketWriter().writeI8(3).writeI8(-1).writeI8(10).writeI8(99).toUint8Array());
assert.deepEqual(grid63.values,[-1,10,99]);

const event65=decodeS2COpcodeMinus65(new PacketWriter().writeI16(10).writeI16(-20).writeI8(3).toUint8Array());
assert.deepEqual([event65.firstShort,event65.secondShort,event65.eventByte],[10,-20,3]);
const event41=decodeS2COpcodeMinus41(new PacketWriter().writeI16(11).writeI8(-2).writeI16(33).toUint8Array());
assert.deepEqual([event41.firstShort,event41.eventByte,event41.secondShort],[11,-2,33]);
const shortIds58=decodeS2COpcode58(new PacketWriter().writeI8(2).writeI16(100).writeI16(-200).toUint8Array());
assert.deepEqual(shortIds58.ids,[100,-200]);
assert.throws(()=>decodeS2COpcode58(new PacketWriter().writeI8(-1).toUint8Array()),/Negative opcode 58 short-ID count/);

const rosterError13=decodeS2COpcode13(new PacketWriter().writeI8(-1).writeUTF("choose another name").toUint8Array());
assert.equal(rosterError13.message,"choose another name");
const roster13Writer=new PacketWriter().writeI8(1).writeI32(12345).writeUTF("Hero").writeI8(2).writeI8(1).writeI8(4).writeI8(-5)
 .writeI16(10).writeI8(11).writeI8(12).writeI16(13).writeI8(-1)
 .writeI32(12345).writeI16(20).writeI8(21).writeI8(22).writeI16(23).writeI8(24).writeI8(25).writeI16(26).writeI8(27).writeI8(28);
const roster13=decodeS2COpcode13(roster13Writer.toUint8Array());
assert.equal(roster13.entries[0].name,"Hero");assert.deepEqual(roster13.entries[0].pairs,[[4,-5]]);
assert.deepEqual(roster13.entries[0].supplemental,{firstShort:20,firstByte:21,secondByte:22,secondShort:23,thirdByte:24,fourthByte:25,thirdShort:26,fifthByte:27,sixthByte:28,parseError:null});
const roster13ResourceWriter=new PacketWriter().writeI8(1).writeI32(8).writeUTF("Hero 2").writeI8(0).writeI8(0)
 .writeI16(1).writeI8(2).writeI8(3).writeI16(4).writeI8(5).writeI16(2).writeU8(6).writeU8(7)
 .writeI16(1).writeU8(8).writeI8(9).writeI8(10);
const roster13Resource=decodeS2COpcode13(roster13ResourceWriter.toUint8Array());
assert.deepEqual([[...roster13Resource.entries[0].resourceA],[...roster13Resource.entries[0].resourceB],roster13Resource.entries[0].resourceTrailer],[[6,7],[8],[9,10]]);

const shop15Item=new PacketWriter().writeI8(1).writeI16(100).writeI16(2).writeI8(3).writeI8(4).writeI16(5)
 .writeI16(6).writeI8(7).writeI8(8).writeI8(9).writeI8(10).writeI8(11).writeI8(12).writeI8(13).writeUTF("sword")
 .writeI16(500).writeI8(1).writeU8(14).writeI16(15);
const shop15Writer=new PacketWriter().writeI8(0).writeI16(77).writeI8(1);
for (const byte of []) shop15Writer.writeI8(byte);
const shop15ItemBytes=shop15Item.toUint8Array();
for (const byte of shop15ItemBytes) shop15Writer.writeU8(byte);
shop15Writer.writeI8(3).writeI16(1).writeI16(2).writeI16(3).writeI16(4).writeI16(5)
 .writeI8(1).writeUTF("sale").writeI8(6).writeI8(-1);
const shop15=decodeS2COpcode15(shop15Writer.toUint8Array());
assert.equal(shop15.shopId,77);assert.equal(shop15.items[0].name,"sword");assert.equal(shop15.items[0].subRecords[0].id,14);
assert.deepEqual(shop15.shortFields,[1,2,3,4,5]);assert.equal(shop15.optionalText,"sale");
const shop15ImageWriter=new PacketWriter().writeI8(1).writeI16(88).writeI8(0).writeI8(3).writeU8(1).writeU8(2);
const shop15Image=decodeS2COpcode15(shop15ImageWriter.toUint8Array());
assert.deepEqual([shop15Image.frameCount,[...shop15Image.imageBytes]],[3,[1,2]]);
