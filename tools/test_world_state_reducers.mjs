import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
import { actorEffectImageResourceId, encodeEffectAssetRequest } from "../src/protocol/effect-assets.js";
import { decodeEffectDefinition } from "../src/protocol/effect-definition.js";
import { decodeActorEffectDefinition, resolveActorEffectFrameIndex, resolveActorEffectSequenceIndex } from "../src/protocol/actor-effect-definition.js";
import { advanceActorEffectPlayback, createActorEffectPlayback, getActorEffectFrameParts, setActorEffectAnimationState } from "../src/protocol/actor-effect-playback.js";
import { advanceTargetLinkedActorPlayback, createTargetLinkedActorPlayback } from "../src/protocol/target-linked-actor.js";
import { advanceEffectPlayback, createEffectPlayback, getEffectFrameParts } from "../src/protocol/effect-playback.js";
import { applyInboundWorldPacket, applyTargetLinkedActorImpactToWorld } from "../src/protocol/world-state.js";
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
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 100);
assert.equal(state.serverWorld.entitiesById["124"].maxHp, 200);
assert.equal(state.serverWorld.entitiesById["124"].currentMp, 300);
assert.equal(state.serverWorld.entitiesById["124"].maxMp, 400);
assert.equal(state.serverWorld.entitiesById["124"].level, 9);

state = { ...state, activeCharacterId: 124 };
const characterResources = new PacketWriter()
  .writeI16(124).writeI8(4)
  .writeUTF("hp").writeI32(1234)
  .writeUTF("mp").writeI32(567)
  .writeUTF("bp").writeI32(8)
  .writeUTF("sp").writeI32(9)
  .writeI8(2).writeI16(77).toUint8Array();
applied = applyInboundWorldPacket(state, { opcode: 32, payload: characterResources });
state = applied.state;
assert.equal(applied.handled, true);
assert.deepEqual(state.serverWorld.characterResourcesById["124"].statsByKey.hp, { key: "hp", value: 1234 });
assert.deepEqual(state.serverWorld.characterResourcesById["124"].statsByKey.mp, { key: "mp", value: 567 });
assert.equal(state.serverWorld.characterResourcesById["124"].localStateByte, 2);
assert.equal(state.serverWorld.characterResourcesById["124"].localShortValue, 77);
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 1234,
  "opcode 32 hp updates current HP without changing max HP");
assert.equal(state.serverWorld.entitiesById["124"].currentMp, 567,
  "opcode 32 mp updates current MP without changing max MP");
assert.equal(state.serverWorld.entitiesById["124"].maxHp, 200,
  "opcode 32 preserves snapshot maximum HP");
assert.equal(state.serverWorld.entitiesById["124"].maxMp, 400,
  "opcode 32 preserves snapshot maximum MP");

const remoteResources = new PacketWriter()
  .writeI16(123).writeI8(1).writeUTF("hp").writeI32(88).toUint8Array();
applied = applyInboundWorldPacket(state, { opcode: 32, payload: remoteResources });
state = applied.state;
assert.equal(state.serverWorld.characterResourcesById["123"].statsByKey.hp.value, 88);
assert.equal(state.serverWorld.characterResourcesById["123"].localStateByte, null,
  "opcode 32 only reads the additional byte/short for the active character");

const ignoredResources = new PacketWriter().writeI16(777).writeI8(1).writeUTF("hp").writeI32(999).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 32, payload: ignoredResources }).state;
assert.equal(state.serverWorld.characterResourcesById["777"], undefined,
  "opcode 32 ignores IDs that do not resolve to a kind-0 player");

const levelUpdate = new PacketWriter().writeI16(124).writeI8(26).writeI32(5000).writeI32(600).toUint8Array();
applied = applyInboundWorldPacket(state, { opcode: 33, payload: levelUpdate });
state = applied.state;
assert.deepEqual(state.serverWorld.characterLevelsById["124"], { level: 26 });
assert.equal(state.serverWorld.entitiesById["124"].level, 26);
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 5000);
assert.equal(state.serverWorld.entitiesById["124"].maxHp, 5000);
assert.equal(state.serverWorld.entitiesById["124"].currentMp, 600);
assert.equal(state.serverWorld.entitiesById["124"].maxMp, 600);
const levelUpEvent = state.serverWorld.worldEvents.at(-1);
assert.equal(levelUpEvent.eventType, "level-up");
assert.equal(levelUpEvent.entityId, 124);
assert.equal(levelUpEvent.level, 26);
assert.equal(levelUpEvent.x, 500);
assert.equal(levelUpEvent.y, 600);
assert.equal(levelUpEvent.entityResolved, true,
  "opcode 33 retains the resolved actor position for one-shot level-up rendering");

const ignoredLevelUp = new PacketWriter().writeI16(777).writeI8(27).writeI32(7000).writeI32(900).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 33, payload: ignoredLevelUp }).state;
assert.equal(state.serverWorld.entitiesById["777"], undefined,
  "opcode 33 does not create missing player entities");
assert.equal(state.serverWorld.characterLevelsById["777"], undefined);

const revivePayload = new PacketWriter().writeI16(124).writeI32(12000)
  .writeI32(2400).writeI16(17).writeI32(9000).toUint8Array();
applied = applyInboundWorldPacket(state, { opcode: 60, payload: revivePayload });
state = applied.state;
const revivedEntity = state.serverWorld.entitiesById["124"];
assert.equal(revivedEntity.currentHp, 9000);
assert.equal(revivedEntity.maxHp, 12000);
assert.equal(revivedEntity.maxMp, 2400);
assert.equal(revivedEntity.currentMp, 600,
  "opcode 60 does not overwrite current MP because original mj.f does not assign bC");
assert.equal(revivedEntity.reviveAuxiliary, 17);
const reviveEvent = state.serverWorld.worldEvents.at(-1);
assert.equal(reviveEvent.opcode, 60);
assert.equal(reviveEvent.eventType, "revive");
assert.equal(reviveEvent.entityResolved, true);
assert.equal(reviveEvent.isLocal, true);
assert.equal(reviveEvent.currentHp, 9000);
const missingRevivePayload = new PacketWriter().writeI16(777).writeI32(500)
  .writeI32(100).writeI16(0).writeI32(500).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 60, payload: missingRevivePayload }).state;
assert.equal(state.serverWorld.entitiesById["777"], undefined,
  "opcode 60 never creates an unknown remote player");
assert.equal(state.serverWorld.worldEvents.at(-1).entityResolved, false);


const entityStateUpdate = new PacketWriter()
  .writeI16(124).writeU8(8).writeI16(940).writeI16(950)
  .writeI32(1200).writeI8(2).writeI8(3).writeI32(2400).writeI32(77).toUint8Array();
applied = applyInboundWorldPacket(state, { opcode: 7, payload: entityStateUpdate });
state = applied.state;
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 1200);
assert.equal(state.serverWorld.entitiesById["124"].maxHp, 2400);
assert.deepEqual(state.serverWorld.entitiesById["124"].opcode7State, {
  templateId: 8, x: 940, y: 950, stateByteD: 2, stateByteI: 3, opaqueInt: 77,
});
assert.equal(state.serverWorld.entitiesById["124"].snapshot.x, 900,
  "opcode 7 retains its coordinate fields without overriding opcode 5 player position");

const unknownEntityState = new PacketWriter()
  .writeI16(777).writeU8(8).writeI16(1).writeI16(2)
  .writeI32(10).writeI8(0).writeI8(0).writeI32(20).writeI32(0).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 7, payload: unknownEntityState }).state;
assert.equal(state.serverWorld.entitiesById["777"], undefined,
  "opcode 7 updates existing entities only and must not create an entity");

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

const ignored = applyInboundWorldPacket(state, { opcode: 111, payload: new Uint8Array() });
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

const lethalCombat = new PacketWriter().writeI16(123).writeI16(124).writeI8(3)
  .writeI32(875).writeI32(0).writeI8(1).writeI8(2).writeI8(3).writeI8(4).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: 6, payload: lethalCombat }).state;
const lethalEvent = state.serverWorld.combatEvents.at(-1);
assert.equal(lethalEvent.targetEntityId, 124);
assert.equal(lethalEvent.targetCurrentHp, 0,
  "combat packet carries the target's authoritative post-hit HP for the death-state transition");
assert.equal(state.serverWorld.entitiesById["124"].currentHp, 0);

// Opcode -74 subcommand 0 attaches the timed visual overlay through bu.a().
const timedEffect = new PacketWriter().writeI8(0).writeI8(0).writeI16(124)
  .writeI16(701).writeI32(15000).writeBool(true).writeBool(false).writeI8(2).toUint8Array();
const timedEffectNow = 1_700_000_000_000;
const beforeTimedEffect = state;
state = applyInboundWorldPacket(state, { opcode: -74, payload: timedEffect }, timedEffectNow).state;
const attachedEntity = state.serverWorld.entitiesById["124"];
const attachedOverlay = attachedEntity.effectOverlays.at(-1);
assert.equal(attachedOverlay.effectId, 701);
assert.equal(attachedOverlay.expiryValue, 1_700_000_015_000n);
assert.equal(attachedOverlay.flagA, true);
assert.equal(attachedOverlay.flagB, false);
assert.equal(attachedOverlay.effectVariant, 2);
assert.ok(attachedOverlay.loopHoldSeconds >= 1 && attachedOverlay.loopHoldSeconds <= 7);
assert.equal(attachedEntity.activeEffects, undefined, "-74 must not enter the -71 status/effect-object collection");
assert.equal(beforeTimedEffect.serverWorld.entitiesById["124"].effectOverlays, undefined,
  "timed overlay reducer must preserve previous entity snapshot");
assert.equal(state.serverWorld.worldEvents.at(-1).overlayApplied, true);

// A duplicate effect ID refreshes only expiry, retaining constructor flags,
// variant and the random hold interval as original bu.a() does.
const timedEffectRefresh = new PacketWriter().writeI8(0).writeI8(0).writeI16(124)
  .writeI16(701).writeI32(5000).writeBool(false).writeBool(true).writeI8(6).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -74, payload: timedEffectRefresh }, timedEffectNow + 100).state;
const refreshedOverlay = state.serverWorld.entitiesById["124"].effectOverlays.at(-1);
assert.equal(refreshedOverlay.expiryValue, 1_700_000_005_100n);
assert.equal(refreshedOverlay.flagA, true);
assert.equal(refreshedOverlay.flagB, false);
assert.equal(refreshedOverlay.effectVariant, 2);
assert.equal(refreshedOverlay.loopHoldSeconds, attachedOverlay.loopHoldSeconds);

// Same ID with a different entity kind must not receive the effect.
const wrongKindEffect = new PacketWriter().writeI8(0).writeI8(1).writeI16(124)
  .writeI16(702).writeI32(3000).writeBool(false).writeBool(false).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -74, payload: wrongKindEffect }, timedEffectNow).state;
assert.equal(state.serverWorld.entitiesById["124"].effectOverlays.length, 1);
assert.equal(state.serverWorld.worldEvents.at(-1).attachedToKnownEntity, false);

// Unsupported subcommands are retained opaque and never parsed as subtype 0.
const otherEffectVariant = new PacketWriter().writeI8(1).writeU8(0xaa).writeU8(0xbb).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -74, payload: otherEffectVariant }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).handled, false);
assert.deepEqual([...state.serverWorld.worldEvents.at(-1).unconsumedBytes], [0xaa, 0xbb]);


// Opcode -71 action 1 / attach mode 0 adds to df only when state=0.
// Coordinates are tile values multiplied by 16; expiry remains a BigInt.
const effectCreate = new PacketWriter().writeI8(1).writeI16(701).writeI16(124)
  .writeI64(123456789n).writeI8(5).writeI8(6).writeI8(0).writeI8(0).writeI8(0)
  .writeI32(88).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: effectCreate }).state;
const effect701 = state.serverWorld.entitiesById["124"].activeEffects.find(effect => effect.effectId === 701);
assert.equal(effect701.expiryValue, 123456789n);
assert.equal(effect701.x, 80);
assert.equal(effect701.y, 96);
assert.equal(effect701.state, 0);
assert.equal(effect701.auxiliary, 88);
assert.equal(state.serverWorld.worldEvents.at(-1).lifecycleApplied, true);

// A duplicate state=0 is ignored; state=1 marks the existing effect for expiry.
const effectDuplicate = new PacketWriter().writeI8(1).writeI16(701).writeI16(124)
  .writeI64(999999999n).writeI8(8).writeI8(9).writeI8(0).writeI8(0).writeI8(0).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: effectDuplicate }).state;
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.find(effect => effect.effectId === 701).expiryValue, 123456789n);
const effectRemove = new PacketWriter().writeI8(1).writeI16(701).writeI16(124)
  .writeI64(999999999n).writeI8(5).writeI8(6).writeI8(0).writeI8(0).writeI8(1).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: effectRemove }).state;
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.find(effect => effect.effectId === 701).expiryValue, 0n);
assert.equal(state.serverWorld.worldEvents.at(-1).lifecycleApplied, true);

// Nonzero attach mode uses the separate bu.de collection.
const attachedEffect = new PacketWriter().writeI8(1).writeI16(702).writeI16(124)
  .writeI64(444n).writeI8(1).writeI8(2).writeI8(0).writeI8(1).writeI8(0).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: attachedEffect }).state;
assert.equal(state.serverWorld.entitiesById["124"].attachedEffects[0].effectId, 702);
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.some(effect => effect.effectId === 702), false);

// action 0 creates a world effect; a resolved entity supplies its world coordinates.
const worldEffect = new PacketWriter().writeI8(0).writeI16(703).writeI16(124)
  .writeI64(555n).writeI8(3).writeI8(4).writeI8(0).writeI8(0).writeI8(0).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: worldEffect }).state;
assert.equal(state.serverWorld.worldEffects.at(-1).effectId, 703);
assert.equal(state.serverWorld.worldEffects.at(-1).x, 500);
assert.equal(state.serverWorld.worldEffects.at(-1).y, 600);
assert.equal(state.serverWorld.worldEvents.at(-1).worldEffectAdded, true);

// A same-ID entity with the wrong kind is not mutated.
const wrongEffectKind = new PacketWriter().writeI8(1).writeI16(704).writeI16(124)
  .writeI64(111n).writeI8(1).writeI8(2).writeI8(1).writeI8(0).writeI8(0).toUint8Array();
state = applyInboundWorldPacket(state, { opcode: -71, payload: wrongEffectKind }).state;
assert.equal(state.serverWorld.worldEvents.at(-1).entityKindMatches, false);
assert.equal(state.serverWorld.entitiesById["124"].activeEffects.some(effect => effect.effectId === 704), false);

// Opcode 15 mode 0 creates the kind-12 actor. Its animation catalog ID
// is auxiliary.fieldS and is distinct from the later -73 target effect ID.
const actorSpawnPacket = new PacketWriter().writeI8(0).writeI16(124).writeI8(0).writeI8(0);
for (let index = 0; index < 5; index += 1) actorSpawnPacket.writeI16(0);
actorSpawnPacket.writeI8(-1).writeI8(0).writeI8(5).writeI16(920).writeI8(0).writeUTF("actor").writeI32(0);
state = applyInboundWorldPacket(state, { opcode: 15, payload: actorSpawnPacket.toUint8Array() }).state;
assert.deepEqual(state.serverWorld.targetLinkedActorsBySourceId["124"], {
  sourceEntityId: 124, animationId: 920, spawnSequence: 1, auxiliaryFieldM: 0,
});
assert.equal(state.serverWorld.worldEvents.at(-1).targetLinkedActorCreated, true);

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
assert.equal(linkedEvent.sequence, 1, "target-linked events need stable identities for actor playback");
assert.equal(linkedEvent.effectId, 909);
assert.equal(linkedEvent.animationId, 920, "actor animation ID comes from opcode 15, not branch-0 effect ID");
assert.equal(linkedEvent.effectActorResolved, true);
assert.equal(linkedEvent.targets.length, 2);
assert.equal(linkedEvent.targets[0].resolved, true);
assert.deepEqual([linkedEvent.targets[0].damageValue, linkedEvent.targets[0].targetCurrentHp], [1111, 888]);
assert.equal(linkedEvent.targets[1].resolved, false, "target lookup requires both entity ID and kind");
assert.equal(linkedEvent.actorSpawnSequence, 1);
assert.equal(state.serverWorld.entitiesById["124"].effectAttachment, undefined,
  "branch 0 must not overwrite the source player's entity record");
assert.equal(beforeLinkedEffect.serverWorld.targetLinkedEffectEvents.length, 0,
  "branch 0 event collection must preserve previous world snapshot");
assert.equal(state.serverWorld.worldEvents.at(-1).effectActorLookupSupported, true);
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
const overlaysAfterRefresh = state.serverWorld.entitiesById["124"].effectOverlays;
assert.equal(overlaysAfterRefresh.length, 2, "the -74 overlay and -73 overlay are stored in the same source collection");
assert.equal(overlaysAfterRefresh.filter(effect => effect.effectId === 910).length, 1,
  "matching -73 effect ID refreshes instead of duplicating its overlay");
assert.equal(overlaysAfterRefresh.find(effect => effect.effectId === 910).expiryValue, 1234567890n);
assert.equal(overlaysAfterRefresh.find(effect => effect.effectId === 701).flagA, true,
  "refreshing another overlay must preserve the -74 constructor flags");
assert.equal(overlaysAfterRefresh.find(effect => effect.effectId === 701).loopHoldSeconds, attachedOverlay.loopHoldSeconds,
  "refreshing another overlay must preserve its d.e random hold interval");

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
const loopEpoch = 1_700_000_000_000;
const delayedLoop = createEffectPlayback(parsedEffectFixture, -1n, 2);
const delayedLoop1 = advanceEffectPlayback(delayedLoop, parsedEffectFixture, loopEpoch);
const delayedLoop2 = advanceEffectPlayback(delayedLoop1, parsedEffectFixture, loopEpoch);
assert.equal(delayedLoop2.sequenceCursor, 2, "p=3 holds on the last frame after stepping to sequence length");
const delayedLoop3 = advanceEffectPlayback(delayedLoop2, parsedEffectFixture, loopEpoch);
assert.equal(delayedLoop3.sequenceCursor, 0, "the first loop wrap is immediate because source q starts at epoch zero");
const delayedLoop4 = advanceEffectPlayback(delayedLoop3, parsedEffectFixture, loopEpoch + 1000);
const delayedLoop5 = advanceEffectPlayback(delayedLoop4, parsedEffectFixture, loopEpoch + 1000);
const delayedLoop6 = advanceEffectPlayback(delayedLoop5, parsedEffectFixture, loopEpoch + 1000);
assert.equal(delayedLoop6.sequenceCursor, 3, "d.e delay holds the final frame on subsequent loops");
const delayedLoop7 = advanceEffectPlayback(delayedLoop6, parsedEffectFixture, loopEpoch + 2100);
assert.equal(delayedLoop7.sequenceCursor, 0, "d.e delay resets the sequence after the source hold interval");

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
// S2C -51 is the generic image-resource response used by hd/mi as well as effects.
const playerPartImage = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x01]);
const playerPartImagePayload = new PacketWriter().writeI16(12000).toUint8Array();
const playerPartImageFrame = new Uint8Array(playerPartImagePayload.length + playerPartImage.length);
playerPartImageFrame.set(playerPartImagePayload);
playerPartImageFrame.set(playerPartImage, playerPartImagePayload.length);
state = applyInboundWorldPacket(state, { opcode: -51, payload: playerPartImageFrame }).state;
assert.deepEqual([...state.serverWorld.resourceImagePayloadsById["12000"]], [...playerPartImage]);
assert.deepEqual([...state.serverWorld.effectImagePayloadsById["12000"]], [...playerPartImage]);
assert.equal(actorEffectImageResourceId(0), 8700);
assert.equal(actorEffectImageResourceId(300), 9000);
assert.equal(actorEffectImageResourceId(301), 14401);
assert.equal(actorEffectImageResourceId(-1), 8699);
assert.equal(actorEffectImageResourceId(18667), 32767);
assert.throws(() => actorEffectImageResourceId(18668), /signed short/);

// Class i/hz target-linked actor catalog is opcode-26 indexedImages; it has
// a distinct parser and 3x14 animation selector from class d overlays.
const actorDefinitionWriter = new PacketWriter()
  .writeI8(1).writeU8(0).writeU8(2).writeU8(3).writeU8(16).writeU8(12)
  .writeI16(1).writeI8(1)
  .writeI16(-4).writeI16(-42).writeI8(0)
  .writeI16(7).writeI16(8).writeI8(1).writeI8(1).writeI8(9)
  .writeI16(1).writeI16(0);
for (let index = 0; index < 8; index += 1) { const first = index === 1 || index === 2 ? 0 : index === 7 ? 255 : index; const second = index === 1 || index === 2 ? 0 : index + 1; actorDefinitionWriter.writeI8(2).writeU8(first).writeU8(second); }
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
const actorPlayback = createActorEffectPlayback(parsedActorDefinition, 3, 0);
assert.equal(actorPlayback.frameIndex, 0);
const actorPlaybackNext = advanceActorEffectPlayback(actorPlayback, parsedActorDefinition);
assert.equal(actorPlaybackNext.cursor, 1);
assert.equal(actorPlaybackNext.frameIndex, 0);
const actorPlaybackState = setActorEffectAnimationState(actorPlaybackNext, parsedActorDefinition, 3, 0);
assert.equal(actorPlaybackState.sequenceIndex, 2);
const actorParts = getActorEffectFrameParts(parsedActorDefinition, 0, 2, 5);
assert.deepEqual(actorParts, [{ x: -12, y: -37, sourceX: 2, sourceY: 3, width: 16, height: 12, transform: 2 }]);
assert.deepEqual(getActorEffectFrameParts(parsedActorDefinition, 0, 1, 0), []);
const actorWorldFixture = { entitiesById: {
  "124": { snapshot: { x: 0, y: 0 } },
  "555": { kind: 1, currentHp: 100, snapshot: { x: 60, y: 0 } },
  "556": { kind: 1, currentHp: 100, snapshot: { x: 80, y: 0 } },
} };
const actorProjectionFixture = new Map([
  ["124", { x: 0, y: 0, playerMovementStep: 3 }],
  ["555", { x: 60, y: 0 }],
  ["556", { x: 80, y: 0 }],
]);
const actorEventFixture = { sourceEntityId: 124, animationId: 920, effectId: 909, targets: [
  { targetEntityId: 555, resolved: true, damageValue: 20, targetCurrentHp: 80 },
  { targetEntityId: 556, resolved: true, damageValue: 20, targetCurrentHp: 80 },
] };
let targetLinkedPlayback = createTargetLinkedActorPlayback(actorEventFixture, actorWorldFixture, actorProjectionFixture, parsedActorDefinition);
assert.equal(targetLinkedPlayback.x, 0);
let targetLinkedImpact = null;
for (let tick = 0; tick < 22; tick += 1) {
  const result = advanceTargetLinkedActorPlayback(targetLinkedPlayback, actorWorldFixture, actorProjectionFixture, parsedActorDefinition);
  targetLinkedPlayback = result.playback;
  if (result.impact) targetLinkedImpact = result.impact;
}
assert.equal(targetLinkedPlayback.x, 30, "actor approaches to the source Manhattan-distance threshold of 30");
assert.equal(targetLinkedPlayback.finished, false);
assert.equal(targetLinkedPlayback.impacted, true);
assert.equal(targetLinkedPlayback.state, 4);
assert.equal(targetLinkedImpact.targets.length, 2, "all linked target records are applied together after the seven-tick impact wait");
assert.deepEqual(targetLinkedImpact.targets.map(item => [item.entityId, item.damageValue, item.targetCurrentHp]), [[555, 20, 80], [556, 20, 80]]);
const idleWorld = { entitiesById: { "124": { state: 0, snapshot: { x: 0, y: 0 } }, "555": { currentHp: 100, snapshot: { x: 60, y: 0 } }, "556": { currentHp: 100, snapshot: { x: 80, y: 0 } } } };
const idleProjection = new Map([["124", { x: 0, y: 0, state: 0, playerMovementStep: 3 }], ["555", { x: 60, y: 0 }], ["556", { x: 80, y: 0 }]]);
const idleStep = advanceTargetLinkedActorPlayback(targetLinkedPlayback, idleWorld, idleProjection, parsedActorDefinition);
assert.equal(idleStep.playback.state, 0, "state 4 returns to idle when source entity state is 0");
assert.equal(idleStep.playback.finished, false, "original actor remains registered while source entity exists");
const idleRoamStart = {
  ...idleStep.playback, state: 0, animationState: 0, idleDirection: 0, idleTicks: 0,
  idleDuration: 200, idleDeltaX: 0, idleDeltaY: 0,
};
const idleRoamStep = advanceTargetLinkedActorPlayback(idleRoamStart, idleWorld, idleProjection, parsedActorDefinition, () => 0);
assert.equal(idleRoamStep.playback.state, 0);
assert.equal(idleRoamStep.playback.idleDirection, 1, "source hz state 0 starts an idle roam after ku.n(12) returns zero");
assert.equal(idleRoamStep.playback.animationState, 2);
assert.equal(idleRoamStep.playback.x, idleRoamStart.x - 2, "idle roam uses the source signed modulo-3 horizontal step");
const idleRoamStop = advanceTargetLinkedActorPlayback(idleRoamStep.playback, idleWorld, idleProjection, parsedActorDefinition, () => 0);
assert.equal(idleRoamStop.playback.idleDirection, 0, "ku.n(16) can stop the current idle roam");
assert.equal(idleRoamStop.playback.x, idleRoamStep.playback.x, "idle stop clears per-tick movement deltas");

const returnWorld = { entitiesById: { "124": { state: 1, snapshot: { x: 100, y: 0 } }, "555": { currentHp: 100, snapshot: { x: 60, y: 0 } }, "556": { currentHp: 100, snapshot: { x: 80, y: 0 } } } };
const returnProjection = new Map([["124", { x: 100, y: 0, state: 1, playerMovementStep: 3 }], ["555", { x: 60, y: 0 }], ["556", { x: 80, y: 0 }]]);
const returnStep = advanceTargetLinkedActorPlayback(targetLinkedPlayback, returnWorld, returnProjection, parsedActorDefinition);
assert.equal(returnStep.playback.state, 1, "state 4 switches to return state when the source is active and more than 40px away");
assert.equal(returnStep.playback.x, 30, "the original switch advances state 4 on this tick; state 1 movement starts next tick");
const returnMoveStep = advanceTargetLinkedActorPlayback(returnStep.playback, returnWorld, returnProjection, parsedActorDefinition);
assert.equal(returnMoveStep.playback.x, 32, "state 1 moves toward the source on the following actor update");
const verticalActorEvent = { sourceEntityId: 124, animationId: 920, effectId: 909, targets: [{ targetEntityId: 555, resolved: true, damageValue: 5, targetCurrentHp: 95 }] };
const verticalActorWorld = { entitiesById: { "124": { snapshot: { x: 0, y: 0 } }, "555": { currentHp: 100, snapshot: { x: 0, y: -60 } } } };
const verticalActorProjections = new Map([["124", { x: 0, y: 0, playerMovementStep: 3 }], ["555", { x: 0, y: -60 }]]);
let verticalActor = createTargetLinkedActorPlayback(verticalActorEvent, verticalActorWorld, verticalActorProjections, parsedActorDefinition);
verticalActor = advanceTargetLinkedActorPlayback(verticalActor, verticalActorWorld, verticalActorProjections, parsedActorDefinition).playback;
assert.equal(verticalActor.y, -2);
assert.equal(verticalActor.directionGroup, 1, "upward actor movement selects the upper animation group");
assert.equal(verticalActor.transform, 0, "vertical movement uses unmirrored part transform");
const previousTargetHp = state.serverWorld.entitiesById["124"].currentHp;
const impactedWorld = applyTargetLinkedActorImpactToWorld(state.serverWorld, { effectId: 910, targets: [{ entityId: 124, targetCurrentHp: 777 }] });
assert.equal(impactedWorld.entitiesById["124"].currentHp, 777, "branch-0 impact mirrors bu.f(int) target HP assignment");
assert.deepEqual(impactedWorld.entitiesById["124"].effectOverlays.find(effect => effect.effectId === 910), { effectId: 910, expiryValue: 0n }, "hz impact refreshes the target overlay expiry through bu.a(int,int,int,long)");
assert.equal(state.serverWorld.entitiesById["124"].currentHp, previousTargetHp, "impact helper must not mutate prior world snapshot");

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

// Opcode 12 transition is isolated from the other reducer fixtures.
let mapState = createInitializationState();
const mapSpawn = new PacketWriter()
  .writeI8(0).writeU8(7).writeI16(124).writeI16(100).writeI16(120).writeI8(2)
  .writeI32(99).writeI8(4).writeI8(5).writeBool(true).toUint8Array();
mapState = applyInboundWorldPacket(mapState, { opcode: 4, payload: mapSpawn }).state;
mapState = { ...mapState, activeCharacterId: 124 };
const remoteSpawn = new PacketWriter()
  .writeI8(1).writeU8(8).writeI16(555).writeI16(300).writeI16(310).writeI8(1)
  .writeI32(77).writeI8(6).writeBool(true).toUint8Array();
mapState = applyInboundWorldPacket(mapState, { opcode: 4, payload: remoteSpawn }).state;
const mapTransitionPayload = new PacketWriter()
  .writeI16(23).writeI16(4).writeI16(6).writeI8(9).writeI16(-1)
  .writeUTF("Rừng sâu").writeBool(true).writeBytes(new Uint8Array([1,2,3,4])).toUint8Array();
const transitioned = applyInboundWorldPacket(mapState, { opcode: 12, payload: mapTransitionPayload });
mapState = transitioned.state;
assert.equal(transitioned.handled,true,"opcode 12 must be handled as a world map transition");
assert.equal(mapState.serverWorld.mapTransition.mapId,23);
assert.equal(mapState.serverWorld.mapTransition.mapResourceId,23,"map resource falls back to map id when fourth short is -1");
assert.equal(mapState.serverWorld.mapTransition.label,"Rừng sâu");
assert.equal(mapState.serverWorld.mapTransition.hfK,9);
assert.deepEqual([...mapState.serverWorld.mapTransition.mapData],[1,2,3,4]);
assert.deepEqual(mapState.serverWorld.entityOrder,[124],"map transition retains only the local actor");
assert.equal(mapState.serverWorld.entitiesById["555"],undefined,"remote actors from the previous map are removed");
assert.equal(mapState.serverWorld.entitiesById["124"].x,72,"tile X maps to (tile*16)+8");
assert.equal(mapState.serverWorld.entitiesById["124"].y,104,"tile Y maps to (tile*16)+8");
assert.equal(mapState.serverWorld.entitiesById["124"].targetX,72);
assert.equal(mapState.serverWorld.entitiesById["124"].movementPending,false);
assert.equal(mapState.serverWorld.entitiesById["124"].positionSource,"opcode12");
assert.equal(mapState.serverWorld.mapTransitionSequence,1);

