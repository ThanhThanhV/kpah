import assert from "node:assert/strict";
import { PacketWriter } from "../src/protocol/generated/packet-codec.js";
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
assert.equal(beforeCombat.serverWorld.entitiesById["124"].currentHp, undefined,
  "combat reducer must not mutate the previous world snapshot");
assert.equal(state.serverWorld.combatEventSequence, 2);

console.log("Inbound world-state reducers: PASS (spawn/update, guarded snapshot, combat event, despawn, unknown opcode)");
