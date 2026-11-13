import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { encodeEffectAssetRequest } from "../src/protocol/effect-assets.js";
import { decodeEffectDefinition } from "../src/protocol/effect-definition.js";
import { decodeActorEffectDefinition, resolveActorEffectFrameIndex, resolveActorEffectSequenceIndex } from "../src/protocol/actor-effect-definition.js";
import { advanceEffectPlayback, createEffectPlayback, getEffectFrameParts } from "../src/protocol/effect-playback.js";
import { applyInboundWorldPacket } from "../src/protocol/world-state.js";
import { createInitializationState } from "../src/protocol/initialization-state.js";

let state = createInitializationState();
const spawn = new PacketWriter()
  .writeI8(1).writeU8(7).writeI16(123).writeI16(456).writeI16(789).writeI8(2)
  .writeI32(99).writeI8(4).writeI8(5).writeBool(true)
  .writeI8(0).writeU8(8).writeI16(124).writeI16(500).writeI16(600).writeI8(1)
  .writeI32(77).writeI8(6).writeBool(true).toUint8Array();
let applied = applyInboundWorldPacket(state, { opcode: 4, payload: spawn });
state = applied.state;
assert.equal(applied.handled, true);
assert.deepEqual(applied.events, ["S2C_OPCODE_4_WORLD"]);
assert.equal(state.serverWorld.entitiesById["123"].templateId, 7);
assert.equal(state.serverWorld.entitiesById["123"].x, 456);
assert.deepEqual(state.serverWorld.entityOrder, [123, 124]);

const moveUpdate = new PacketWriter()
  .writeI8(1).writeU8(7).writeI16(123).writeI16(200).writeI16(300).writeI8(2)
  .writeI32(-1).writeI8(8).writeI8(9).writeBool(true).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 4, payload: moveUpdate }).state;
assert.equal(state.serverWorld.entitiesById["123"].x, 456, "cd current position is not teleported by a target update");
assert.equal(state.serverWorld.entitiesById["123"].y, 789);
assert.equal(state.serverWorld.entitiesById["123"].targetX, 200);
assert.equal(state.serverWorld.entitiesById["123"].targetY, 300);
assert.equal(state.serverWorld.entitiesById["123"].movementPending, true);
assert.equal(state.serverWorld.entitiesById["123"].extraInt, 99, "existing cd.L remains from spawn");

const snapshot = new PacketWriter().writeI16(124).writeUTF("Hero").writeI16(900).writeI16(901);
for (const n of [100, 200, 300, 400]) snapshot.writeI32(n);
snapshot.writeI8(1).writeI8(2);
for (let i = 0; i < 7; i++) snapshot.writeI8(i);
for (let i = 0; i < 7; i++) snapshot.writeI16(10 + i);
snapshot.writeI16(50).writeI8(6).writeI16(70).writeI16(80).writeI8(9).writeI8(10)
  .writeI8(2).writeI8(3).writeI8(4).writeI8(5).writeI16(99).writeI8(7).writeI8(8).writeI8(13);
for (let i = 0; i < 5; i++) snapshot.writeI16(200 + i);
snapshot.writeBool(true).writeBool(false).writeI8(11).writeI8(12).writeBool(true);
const snapshotPayload = snapshot.toUint8Array();
applied = applyInboundWorldPacket(state, { opcode: 5, payload: snapshotPayload });
state = applied.state;
assert.equal(state.serverWorld.entitiesById["124"].snapshot.name, "Hero");
assert.equal(state.serverWorld.entitiesById["124"].snapshot.x, 900);

const playerMoveUpdate = new PacketWriter()
  .writeI8(0).writeU8(8).writeI16(124).writeI16(950).writeI16(960).writeI8(1)
  .writeI32(-1).writeI8(0).writeBool(true).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 4, payload: playerMoveUpdate }).state;
assert.equal(state.serverWorld.entitiesById["124"].targetX, 950);
assert.equal(state.serverWorld.entitiesById["124"].targetY, 960);
assert.equal(state.serverWorld.entitiesById["124"].movementPending, true);
assert.equal(state.serverWorld.entitiesById["124"].snapshot.x, 900,
  "opcode 4 player target must not overwrite opcode 5 current position");

// Opcode 5 for an entity that has not spawned is retained as opaque bytes,
// matching the original handler's existing-entity guard.
const unknownPayload = new PacketWriter().writeI16(999).writeU8(0xaa).writeU8(0xbb).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 5, payload: unknownPayload }).state;
assert.equal(state.serverWorld.unknownEntitySnapshots[0].entityId, 999);
assert.deepEqual([...state.serverWorld.unknownEntitySnapshots[0].unconsumedBytes], [0xaa, 0xbb]);

// Opcode 5 is the original kind-0 z player update path, not a generic cd monster snapshot.
const monsterSnapshot = new PacketWriter().writeI16(123).writeU8(0xcc).writeU8(0xdd).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 5, payload: monsterSnapshot }).state;
assert.equal(state.serverWorld.entitiesById["123"].snapshot, undefined);
assert.equal(state.serverWorld.unknownEntitySnapshots.at(-1).entityId, 123);
assert.deepEqual([...state.serverWorld.unknownEntitySnapshots.at(-1).unconsumedBytes], [0xcc, 0xdd]);

const combat = new PacketWriter().writeI16(123).writeI16(124).writeI8(3).writeI32(400).writeI32(900)
  .writeI8(1).writeI8(2).writeI8(3).writeI8(4).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 6, payload: combat }).state;
assert.equal(state.serverWorld.combatEvents[0].firstEntityId, 123);
assert.equal(state.serverWorld.combatEvents[0].valueA, 400);

const remove = new PacketWriter().writeI16(123).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 8, payload: remove }).state;
assert.equal(state.serverWorld.entitiesById["123"], undefined);
assert.deepEqual(state.serverWorld.entityOrder, [124]);
assert.deepEqual(state.serverWorld.removedEntityIds, [123]);

const ignored = applyInboundWorldPacket(state, { opcode: 7, payload: new Uint8Array() });
assert.equal(ignored.handled, false);
assert.equal(ignored.state, state);

// Opcode 9 uses the same verified attacker/target/damage/current-HP field layout
// but remains tagged as its own original handler branch.
const combat9 = new PacketWriter().writeI16(124).writeI16(124).writeI8(6)
  .writeI32(125).writeI32(875).writeI8(2).writeI8(1).writeI8(0).writeI8(3).toUint8Array();
const beforeCombat = state;
state = applyInboundWorldPacket(state, { opcode: 9, payload: combat9 }).state;
const combatEvent = state.serverWorld.combatEvents.at(-1);
assert.equal(combatEvent.opcode, 9);
assert.equal(combatEvent.sequence, 2);
assert.equal(combatEvent.attackerEntityId, 124);
assert.equal(combatEvent.targetEntityId, 124);
assert.equal(combatEvent.damage, 125);
assert.equal(combatEvent.targetCurrentHp, 875);
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 875);
assert.equal(beforeCombat.serverWorld.entitiesById["124"].currentHp, 900,
  "combat reducer must not mutate the previous world snapshot");
assert.equal(state.serverWorld.combatEventSequence, 2);

// Opcode 10 forwards two shorts and two ints to the world scene without guessing their meaning.
const opcode10 = new PacketWriter().writeI16(12).writeI16(34).writeI32(560).writeI32(780).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 10, payload: opcode10 }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).opcode, 10);
assert.deepEqual([state.serverWorld.worldEvents.at(-1).first, state.serverWorld.worldEvents.at(-1).second, state.serverWorld.worldEvents.at(-1).valueA, state.serverWorld.worldEvents.at(-1).valueB], [12, 34, 560, 780]);

// Opcode 83 only decodes when the source entity exists, matching the original handler guard.
const opcode83 = new PacketWriter().writeI16(124).writeI8(7).writeI8(1).writeI16(124).writeI32(111).writeI32(222).writeU8(3).writeU8(4).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 83, payload: opcode83 }).state;
assert.deepEqual(state.serverWorld.entitiesById["124"].opcode83State, { valueA: 111, valueB: 222 });
assert.equal(state.serverWorld.worldEvents.at(-1).targets[0].targetId, 124);
const missingSource83 = new PacketWriter().writeI16(999).writeI8(7).writeI8(1).writeI16(124).writeI32(1).writeI32(2).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 83, payload: missingSource83 }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).handledByOriginalGuard, false);
assert.deepEqual([...state.serverWorld.worldEvents.at(-1).opaquePayload], [...missingSource83.slice(3)]);

// Opcode 106 carries shared damage plus target/current-HP records.
const opcode106 = new PacketWriter().writeI16(124).writeI8(8).writeI32(75).writeI8(1).writeI8(2).writeI8(3).writeI8(2).writeI16(124).writeI32(800).writeI16(123).writeI32(0).toUint8Array();
const before106 = state;
state = applyInboundWorldPacket(state, { opcode: 106, payload: opcode106 }).state;
const multiHit = state.serverWorld.combatEvents.at(-1);
assert.equal(multiHit.opcode, 106);
assert.equal(multiHit.sequence, 3);
assert.equal(multiHit.attackerEntityId, 124);
assert.equal(multiHit.damage, 75);
assert.deepEqual(multiHit.targets.map(target => target.entityId), [124, 123]);
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 800);
assert.equal(before106.serverWorld.entitiesById["124"].currentHp, 875, "opcode 106 must preserve previous world snapshot");

// Opcode -74 subcommand 0 attaches the timed effect only to a matching
// entity ID and entity kind. Duration remains raw; client does not invent
// expiry clock semantics or classify the effect as a buff/debuff.
const timedEffect = new PacketWriter().writeI8(0).writeI8(0).writeI16(124)
  .writeI16(701).writeI32(15000).writeBool(true).writeBool(false).writeI8(2).toUint8Array();
const beforeTimedEffect = state;
state = applyInboundWorldPacket(state, { opcode: -74, payload: timedEffect }).state;
const attachedEntity = state.serverWorld.entitiesById["124"];
assert.equal(attachedEntity.activeEffects.at(-1).effectId, 701);
assert.equal(attachedEntity.activeEffects.at(-1).durationValue, 15000);
assert.equal(attachedEntity.activeEffects.at(-1).durationIsPositive, true);
assert.equal(attachedEntity.activeEffects.at(-1).flagA, true);
assert.equal(attachedEntity.activeEffects.at(-1).flagB, false);
assert.equal(attachedEntity.activeEffects.at(-1).effectVariant, 2);
assert.equal(beforeTimedEffect.serverWorld.entitiesById["124"].activeEffects, undefined,
  "timed effect reducer must preserve previous entity snapshot");
assert.equal(state.serverWorld.worldEvents.at(-1).attachedToKnownEntity, true);

// Same ID with a different entity kind must not receive the effect.
const wrongKindEffect = new PacketWriter().writeI8(0).writeI8(1).writeI16(124)
  .writeI16(702).writeI32(3000).writeBool(false).writeBool(false).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -74, payload: wrongKindEffect }).state;
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.length, 1);
assert.equal(state.serverWorld.worldEvents.at(-1).attachedToKnownEntity, false);

// Unsupported subcommands are retained opaque and never parsed as subtype 0.
const otherEffectVariant = new PacketWriter().writeI8(1).writeU8(0xaa).writeU8(0xbb).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -74, payload: otherEffectVariant }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).handled, false);
assert.deepEqual([...state.serverWorld.worldEvents.at(-1).unconsumedBytes], [0xaa, 0xbb]);


// Opcode -71 action 1 / attach mode 0 creates or refreshes an effect record.
// Its 64-bit time value remains BigInt and is not reinterpreted as duration.
const effectCreate = new PacketWriter().writeI8(1).writeI16(701).writeI16(124)
  .writeI64(123456789n).writeI8(5).writeI8(6).writeI8(0).writeI8(0).writeI8(7)
  .writeI32(88).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: effectCreate }).state;
const effect701 = state.serverWorld.entitiesById["124"].activeEffects.find(effect => effect.effectId === 701);
assert.equal(effect701.expiryValue, 123456789n);
assert.equal(effect701.xTile, 5);
assert.equal(effect701.yTile, 6);
assert.equal(effect701.state, 7);
assert.equal(effect701.auxiliary, 88);
assert.equal(state.serverWorld.worldEvents.at(-1).lifecycleApplied, true);

// Source branch mode 1 marks the matching effect expiry as zero rather than
// deleting it immediately; the original runtime owns expiry/removal timing.
const effectRemove = new PacketWriter().writeI8(1).writeI16(701).writeI16(124)
  .writeI64(999999999n).writeI8(5).writeI8(6).writeI8(0).writeI8(1).writeI8(7).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: effectRemove }).state;
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.find(effect => effect.effectId === 701).expiryValue, 0n);
assert.equal(state.serverWorld.worldEvents.at(-1).lifecycleApplied, true);

// A same-ID entity with the wrong kind is not mutated.
const wrongEffectKind = new PacketWriter().writeI8(1).writeI16(702).writeI16(124)
  .writeI64(111n).writeI8(1).writeI8(2).writeI8(1).writeI8(0).writeI8(3).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: wrongEffectKind }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).entityKindMatches, false);
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.some(effect => effect.effectId === 702), false);

// Opcode -73 branch 0 is keyed by source entity ID, but the original
// handler resolves a separate kind-12 hz actor from mj's actor list. That
// actor registry is not represented by entitiesById, so retain the event
// without mutating a same-ID player entity or pretending the actor resolved.
const linkedEffect = new PacketWriter().writeI16(124).writeI8(0).writeI16(909).writeI8(2)
  .writeI8(0).writeI16(124).writeI32(1111).writeI32(888)
  .writeI8(1).writeI16(555).writeI32(3333).writeI32(4444).toUint8Array();
const beforeLinkedEffect = state;
state = applyInboundWorldPacket(state, { opcode: -73, payload: linkedEffect }).state;
const linkedEvent = state.serverWorld.targetLinkedEffectEvents.at(-1);
assert.equal(linkedEvent.sourceEntityId, 124);
assert.equal(linkedEvent.effectId, 909);
assert.equal(linkedEvent.targets.length, 2);
assert.equal(linkedEvent.targets[0].resolved, true);
assert.deepEqual([linkedEvent.targets[0].damageValue, linkedEvent.targets[0].targetCurrentHp], [1111, 888]);
assert.equal(linkedEvent.targets[1].resolved, false, "target lookup requires both entity ID and kind");
assert.equal(linkedEvent.effectActorResolved, false);
assert.equal(state.serverWorld.entitiesById["124"].effectAttachment, undefined,
  "branch 0 must not overwrite the source player's entity record");
assert.equal(beforeLinkedEffect.serverWorld.targetLinkedEffectEvents.length, 0,
  "branch 0 event collection must preserve previous world snapshot");
assert.equal(state.serverWorld.worldEvents.at(-1).effectActorLookupSupported, false);
assert.equal(state.serverWorld.worldEvents.at(-1).resolvedTargetCount, 1);

// Opcode -73 branch 1 adds/refreshes a visual effect overlay in the entity's
// original bu.dg collection; the source passes entity coordinates and a long value.
const overlayCreate = new PacketWriter().writeI16(124).writeI8(1).writeI16(910)
  .writeI64(987654321n).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -73, payload: overlayCreate }).state;
assert.equal(state.serverWorld.entitiesById["124"].effectOverlays.at(-1).effectId, 910);
assert.equal(state.serverWorld.entitiesById["124"].effectOverlays.at(-1).expiryValue, 987654321n);
assert.equal(state.serverWorld.worldEvents.at(-1).overlayApplied, true);
const overlayRefresh = new PacketWriter().writeI16(124).writeI8(1).writeI16(910)
  .writeI64(1234567890n).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -73, payload: overlayRefresh }).state;
assert.equal(state.serverWorld.entitiesById["124"].effectOverlays.length, 1,
  "matching effect ID refreshes instead of duplicating the overlay");
assert.equal(state.serverWorld.entitiesById["124"].effectOverlays[0].expiryValue, 1234567890n);

// Unsupported branch is retained opaque, without guessing its payload.
const unsupportedMinus73 = new PacketWriter().writeI16(124).writeI8(2).writeU8(0xaa).writeU8(0xbb).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -73, payload: unsupportedMinus73 }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).handled, false);
assert.deepEqual([...state.serverWorld.worldEvents.at(-1).unconsumedBytes], [0xaa, 0xbb]);

// Effect definition format mirrors d.a(byte[]): region table, frame parts,
// frame index sequence, then three length-prefixed auxiliary arrays.
const effectDefinitionFixture = new PacketWriter()
  .writeI8(1)
  .writeU8(7).writeU8(10).writeU8(20).writeU8(30).writeU8(40)
  .writeI16(1).writeI8(2)
  .writeI16(-12).writeI16(25).writeI8(0)
  .writeI16(4).writeI16(5).writeI8(6).writeI8(7).writeI8(0)
  .writeI16(8).writeI16(-9).writeI8(0)
  .writeI16(1).writeI16(2).writeI8(3).writeI8(4).writeI8(1)
  .writeU8(2).writeI16(0).writeI16(0)
  .writeI8(99)
  .writeI8(2).writeI8(11).writeI8(12)
  .writeI8(1).writeI8(13)
  .writeI8(0)
  .toUint8Array();
const parsedEffectFixture = decodeEffectDefinition(effectDefinitionFixture);
assert.deepEqual(parsedEffectFixture.regions[0], {headerTag:7,x:10,y:20,width:30,height:40});
assert.equal(parsedEffectFixture.frames.length,1);
assert.equal(parsedEffectFixture.frames[0].groupZero.length,1);
assert.equal(parsedEffectFixture.frames[0].groupNonZero.length,1);
assert.equal(parsedEffectFixture.frames[0].groupZero[0].x,-12);
assert.equal(parsedEffectFixture.frames[0].groupZero[0].regionIndex,0);
assert.deepEqual(parsedEffectFixture.frameSequence,[0,0]);
assert.equal(parsedEffectFixture.sequenceHeaderByte,99);
assert.deepEqual([...parsedEffectFixture.auxiliaryArrays.array0],[11,12]);
assert.deepEqual([...parsedEffectFixture.auxiliaryArrays.array1],[13]);
assert.equal(parsedEffectFixture.trailingBytes.length,0);
assert.throws(()=>decodeEffectDefinition(new Uint8Array([1,2])),/Truncated effect definition/);

// Source d.a(Graphics,...) resolves frame parts against atlas rectangles.
const renderParts = getEffectFrameParts(parsedEffectFixture, 0);
assert.deepEqual(renderParts.groupZero[0].region, {x:10,y:20,width:30,height:40});
assert.equal(renderParts.groupZero[0].drawable, true);
assert.equal(renderParts.groupNonZero[0].drawable, true);
assert.deepEqual(getEffectFrameParts(parsedEffectFixture, 9), {groupZero:[],groupNonZero:[]});

// Original d.a() advances one sequence entry per invocation. The browser
// deliberately does not assume a frame interval; the scene drives each tick.
const oncePlayback = createEffectPlayback(parsedEffectFixture, 0n);
assert.equal(oncePlayback.mode, "once");
const onceStep = advanceEffectPlayback(oncePlayback, parsedEffectFixture, 1000);
assert.equal(onceStep.frameIndex, 0);
assert.equal(onceStep.finished, false);
const onceFinished = advanceEffectPlayback(onceStep, parsedEffectFixture, 1000);
assert.equal(onceFinished.finished, true);
const loopPlayback = createEffectPlayback(parsedEffectFixture, -1n);
assert.equal(loopPlayback.mode, "loop");
const loopStep1 = advanceEffectPlayback(loopPlayback, parsedEffectFixture, 1000);
const loopStep2 = advanceEffectPlayback(loopStep1, parsedEffectFixture, 1000);
const loopStep3 = advanceEffectPlayback(loopStep2, parsedEffectFixture, 1000);
assert.equal(loopStep3.finished, false);
assert.equal(loopStep3.sequenceCursor, 0);
const timedPlayback = createEffectPlayback(parsedEffectFixture, 2000n);
assert.equal(timedPlayback.mode, "until-expiry");
assert.equal(advanceEffectPlayback(timedPlayback, parsedEffectFixture, 1999).finished, false);
assert.equal(advanceEffectPlayback(timedPlayback, parsedEffectFixture, 2001).finished, true);

// Opcode 26 indexedGraphics carries d.i effect definitions. Branch-1
// effect IDs use the same ID as the C2S -51 image resource request.
const opcode26DefinitionWriter = new PacketWriter()
  .writeU8(0).writeI16(0)
  .writeU8(0)
  .writeU8(0)
  .writeI16(1).writeI16(910).writeI16(effectDefinitionFixture.length);
opcode26DefinitionWriter.bytes.push(...effectDefinitionFixture);
const opcode26Definition = opcode26DefinitionWriter
  .writeI8(0)
  .writeI8(0).writeI8(0)
  .writeI8(0).writeI8(0)
  .writeI8(0).writeI8(0)
  .toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 26, payload: opcode26Definition }).state;
assert.deepEqual([...state.serverWorld.effectDefinitionsById["910"]], [...effectDefinitionFixture]);
assert.equal(state.serverWorld.parsedEffectDefinitionsById["910"].frames.length, 1);
assert.equal(state.serverWorld.effectDefinitionErrorsById["910"], undefined);
assert.deepEqual([...encodeEffectAssetRequest(910)], [0x03, 0x8e]);
assert.throws(() => encodeEffectAssetRequest(40000), /signed short/);

// Class i/hz target-linked actor catalog is opcode-26 indexedImages; it has
// a distinct parser and 3x14 animation selector from class d overlays.
const actorDefinitionWriter = new PacketWriter()
  .writeI8(1).writeU8(0).writeU8(2).writeU8(3).writeU8(16).writeU8(12)
  .writeI16(1).writeI8(1)
  .writeI16(-4).writeI16(-42).writeI8(0)
  .writeI16(7).writeI16(8).writeI8(1).writeI8(1).writeI8(9)
  .writeI16(1).writeI16(0);
for (let index = 0; index < 8; index += 1) { const first = index === 2 ? 0 : index === 7 ? 255 : index; const second = index === 2 ? 0 : index + 1; actorDefinitionWriter.writeI8(2).writeU8(first).writeU8(second); }
actorDefinitionWriter.writeI8(99).writeI8(-2).writeI8(3);
for (let index = 0; index < 4; index += 1) actorDefinitionWriter.writeI8(1).writeU8(20 + index);
const actorDefinitionFixture = actorDefinitionWriter.toUint8Array();
const parsedActorDefinition = decodeActorEffectDefinition(actorDefinitionFixture);
assert.equal(parsedActorDefinition.regions[0].width, 16);
assert.deepEqual(parsedActorDefinition.frames[0].parts[0], { x: -4, y: -42, regionIndex: 0, auxiliaryX: 7, auxiliaryY: 8, auxiliaryRegionIndex: 1, auxiliaryFlag: 1, partFlag: 9 });
assert.equal(parsedActorDefinition.frames[0].offsetX, -2);
assert.equal(parsedActorDefinition.frames[0].offsetY, 3);
assert.deepEqual([...parsedActorDefinition.animationSequences[3]], [3, 4]);
assert.equal(parsedActorDefinition.animationSequences[7][0], -1, "Java byte[] sequences must retain signed byte values");
assert.deepEqual([...parsedActorDefinition.optionalSequences[2]], [22]);
assert.equal(parsedActorDefinition.firstFrameMaxBottom, -30);
assert.equal(resolveActorEffectSequenceIndex(0, 3), 2);
assert.equal(resolveActorEffectSequenceIndex(1, 3), 6);
assert.equal(resolveActorEffectFrameIndex(parsedActorDefinition, 3, 0, 1), 0);
assert.equal(resolveActorEffectFrameIndex(parsedActorDefinition, 3, 2, 0), null);
assert.throws(() => decodeActorEffectDefinition(actorDefinitionFixture.slice(0, -1)), /Truncated/);

// Opcode 26 independently carries class-i indexedImages and class-d indexedGraphics.
const opcode26ActorWriter = new PacketWriter().writeU8(0).writeI16(0).writeU8(0)
  .writeU8(1).writeI16(920).writeI16(actorDefinitionFixture.length);
opcode26ActorWriter.bytes.push(...actorDefinitionFixture);
opcode26ActorWriter.writeI16(1).writeI16(910).writeI16(effectDefinitionFixture.length);
opcode26ActorWriter.bytes.push(...effectDefinitionFixture);
const opcode26ActorPacket = opcode26ActorWriter.writeI8(0)
  .writeI8(0).writeI8(0).writeI8(0).writeI8(0).writeI8(0).writeI8(0).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 26, payload: opcode26ActorPacket }).state;
assert.deepEqual([...state.serverWorld.actorEffectDefinitionsById["920"]], [...actorDefinitionFixture]);
assert.equal(state.serverWorld.parsedActorEffectDefinitionsById["920"].frames.length, 1);
assert.equal(state.serverWorld.actorEffectDefinitionErrorsById["920"], undefined);
assert.deepEqual([...state.serverWorld.effectDefinitionsById["910"]], [...effectDefinitionFixture]);

// S2C -51 is short resource ID + all remaining opaque image bytes.
const effectImageResponse = new PacketWriter().writeI16(910).writeU8(0x89).writeU8(0x50).writeU8(0x4e).writeU8(0x47).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -51, payload: effectImageResponse }).state;
assert.deepEqual([...state.serverWorld.effectImagePayloadsById["910"]], [0x89, 0x50, 0x4e, 0x47]);
assert.equal(state.serverWorld.worldEvents.at(-1).imageByteLength, 4);

console.log("Inbound world-state reducers: PASS (spawn/update, guarded snapshot, combat event, despawn, unknown opcode)");
