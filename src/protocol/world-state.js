import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9 } from "./generated/world-state-codec.js";
import { decodeS2COpcode5 } from "./generated/opcode5-codec.js";
import { decodeS2CTemplateCatalog, decodeS2CTemplateAsset } from "./template-assets.js";

export function createServerWorldState() {
  return {
    entitiesById: {},
    entityOrder: [],
    templatesById: {},
    templateAssetPayloadsById: {},
    unknownEntitySnapshots: [],
    combatEvents: [],
    combatEventSequence: 0,
    lastSpawnBatch: [],
    removedEntityIds: [],
  };
}

function copyBytes(value) {
  return value instanceof Uint8Array ? new Uint8Array(value) : new Uint8Array();
}

function cloneWorld(world) {
  const source = world ?? createServerWorldState();
  return {
    ...source,
    entitiesById: { ...(source.entitiesById ?? {}) },
    entityOrder: [...(source.entityOrder ?? [])],
    templatesById: { ...(source.templatesById ?? {}) },
    templateAssetPayloadsById: { ...(source.templateAssetPayloadsById ?? {}) },
    unknownEntitySnapshots: [...(source.unknownEntitySnapshots ?? [])],
    combatEvents: [...(source.combatEvents ?? [])],
    lastSpawnBatch: [...(source.lastSpawnBatch ?? [])],
    removedEntityIds: [...(source.removedEntityIds ?? [])],
  };
}

export function applyS2COpcode4World(world, packet) {
  if (!packet || !Array.isArray(packet.entities)) throw new TypeError("Opcode 4 entities must be an array");
  const next = cloneWorld(world);
  const batch = [];
  for (const record of packet.entities) {
    if (!Number.isInteger(record.entityId)) continue;
    const id = String(record.entityId);
    const previous = next.entitiesById[id] ?? null;
    let entity;
    if (previous && previous.kind === 1 && record.kind === 1) {
      // Original mj spawn/update handler calls cd.a(x,y) for an existing kind-1
      // actor. cd stores M/N targets; current l/m move later in cd.y().
      const movementEnabled = Number.isInteger(previous.extraInt) && previous.extraInt >= 0;
      const targetX = movementEnabled ? record.x : null;
      const targetY = movementEnabled ? record.y : null;
      entity = {
        ...previous,
        active: record.active,
        targetX,
        targetY,
        movementPending: movementEnabled && record.active !== false
          && (record.x !== previous.x || record.y !== previous.y),
      };
    } else if (previous && previous.kind === 0 && record.kind === 0) {
      // Existing kind-0 actor resolves to z and routes through z.a(x,y)/z.b(x,y),
      // which stores ay/az for its own movement state instead of teleporting.
      entity = {
        ...previous,
        active: record.active,
        targetX: record.x,
        targetY: record.y,
        movementPending: record.active !== false
          && (record.x !== previous.x || record.y !== previous.y),
      };
    } else {
      entity = { ...previous, ...record, targetX: null, targetY: null, movementPending: false };
    }
    next.entitiesById[id] = entity;
    if (!next.entityOrder.includes(record.entityId)) next.entityOrder.push(record.entityId);
    batch.push({ ...entity });
  }
  next.lastSpawnBatch = batch;
  return next;
}

export function applyS2COpcode5World(world, payload) {
  const current = world ?? createServerWorldState();
  if (!(payload instanceof Uint8Array)) throw new TypeError("Opcode 5 payload must be Uint8Array");
  if (payload.length < 2) throw new RangeError("Opcode 5 payload is missing entity id");
  const entityId = (payload[0] << 8) | payload[1];
  const signedEntityId = entityId > 0x7fff ? entityId - 0x10000 : entityId;
  const existingEntity = current.entitiesById?.[String(signedEntityId)];
  // Original ka opcode 5 resolves through mj.b(short), which only returns kind 0
  // player actors before casting to z. A kind 1 cd monster is not a valid target.
  const exists = existingEntity?.kind === 0;
  const snapshot = decodeS2COpcode5(payload, { entityExists: exists });
  const next = cloneWorld(current);
  if (!exists) {
    next.unknownEntitySnapshots.push({
      entityId: snapshot.entityId,
      unconsumedBytes: copyBytes(snapshot.unconsumedBytes),
    });
    if (next.unknownEntitySnapshots.length > 50) next.unknownEntitySnapshots.shift();
    return next;
  }
  next.entitiesById[String(snapshot.entityId)] = {
    ...next.entitiesById[String(snapshot.entityId)],
    snapshot,
  };
  return next;
}

export function applyS2COpcode8World(world, packet) {
  if (!packet || !Array.isArray(packet.entityIds)) throw new TypeError("Opcode 8 entityIds must be an array");
  const next = cloneWorld(world);
  const removed = new Set(packet.entityIds);
  for (const id of packet.entityIds) delete next.entitiesById[String(id)];
  next.entityOrder = next.entityOrder.filter(id => !removed.has(id));
  next.removedEntityIds = [...packet.entityIds];
  return next;
}

function applyCombatEvent(world, opcode, packet) {
  const next = cloneWorld(world);
  const sequence = next.combatEventSequence + 1;
  const event = {
    sequence,
    opcode,
    ...packet,
    attackerEntityId: packet.firstEntityId,
    targetEntityId: packet.secondEntityId,
    damage: packet.valueA,
    targetCurrentHp: packet.valueB,
  };
  next.combatEventSequence = sequence;
  const target = next.entitiesById[String(event.targetEntityId)];
  if (target) {
    next.entitiesById[String(event.targetEntityId)] = {
      ...target,
      currentHp: event.targetCurrentHp,
    };
  }
  next.combatEvents.push(event);
  if (next.combatEvents.length > 100) next.combatEvents.splice(0, next.combatEvents.length - 100);
  return next;
}

/**
 * Applies only world/template packets with verified decoder layouts and
 * source-backed original handler paths. Asset payloads remain opaque until
 * their proprietary image/atlas container is decoded.
 */
export function applyInboundWorldPacket(state, frame) {
  if (!state || typeof state !== "object") throw new TypeError("Client state is required");
  if (!frame || !Number.isInteger(frame.opcode) || !(frame.payload instanceof Uint8Array)) {
    throw new TypeError("A decoded S2C frame is required");
  }
  const world = state.serverWorld ?? createServerWorldState();
  let nextWorld;
  let event;
  switch (frame.opcode) {
    case 4:
      event = decodeS2COpcode4(frame.payload);
      nextWorld = applyS2COpcode4World(world, event);
      break;
    case 5:
      nextWorld = applyS2COpcode5World(world, frame.payload);
      event = { entityId: (frame.payload[0] << 8) | frame.payload[1] };
      break;
    case 6:
      event = decodeS2COpcode6(frame.payload);
      nextWorld = applyCombatEvent(world, 6, event);
      break;
    case 8:
      event = decodeS2COpcode8(frame.payload);
      nextWorld = applyS2COpcode8World(world, event);
      break;
    case 9:
      event = decodeS2COpcode9(frame.payload);
      nextWorld = applyCombatEvent(world, 9, event);
      break;
    case 100:
      event = decodeS2CTemplateCatalog(frame.payload);
      if (!event.handled) return { state, opcode: frame.opcode, handled: false, events: [] };
      nextWorld = cloneWorld(world);
      nextWorld.templatesById[String(event.templateId)] = event.template;
      break;
    case -47:
      event = decodeS2CTemplateAsset(frame.payload);
      nextWorld = cloneWorld(world);
      if (Object.prototype.hasOwnProperty.call(nextWorld.templatesById, String(event.templateId))) {
        nextWorld.templateAssetPayloadsById[String(event.templateId)] = copyBytes(event.payload);
      } else {
        return { state, opcode: frame.opcode, handled: false, events: [], packet: { templateId: event.templateId } };
      }
      break;
    default:
      return { state, opcode: frame.opcode, handled: false, events: [] };
  }
  const nextState = { ...state, serverWorld: nextWorld };
  return { state: nextState, opcode: frame.opcode, handled: true,
    events: ["S2C_OPCODE_" + frame.opcode + "_WORLD"], packet: event };
}
