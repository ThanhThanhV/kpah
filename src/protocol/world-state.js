import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9, decodeS2COpcode10, decodeS2COpcode83, decodeS2COpcode106, decodeS2COpcodeMinus74, decodeS2COpcodeMinus71, decodeS2COpcodeMinus73, decodeS2COpcodeMinus51, decodeS2COpcode26 } from "./generated/world-state-codec.js";
import { decodeS2COpcode5 } from "./generated/opcode5-codec.js";
import { decodeS2CTemplateCatalog, decodeS2CTemplateAsset } from "./template-assets.js";
import { decodeEffectDefinition } from "./effect-definition.js";
import { decodeActorEffectDefinition } from "./actor-effect-definition.js";

export function createServerWorldState() {
  return {
    entitiesById: {},
    entityOrder: [],
    templatesById: {},
    templateAssetPayloadsById: {},
    effectDefinitionsById: {},
    parsedEffectDefinitionsById: {},
    actorEffectDefinitionsById: {},
    parsedActorEffectDefinitionsById: {},
    actorEffectDefinitionErrorsById: {},
    effectDefinitionErrorsById: {},
    effectImagePayloadsById: {},
    targetLinkedEffectEvents: [],
    unknownEntitySnapshots: [],
    combatEvents: [],
    combatEventSequence: 0,
    worldEvents: [],
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
    effectDefinitionsById: { ...(source.effectDefinitionsById ?? {}) },
    parsedEffectDefinitionsById: { ...(source.parsedEffectDefinitionsById ?? {}) },
    actorEffectDefinitionsById: { ...(source.actorEffectDefinitionsById ?? {}) },
    parsedActorEffectDefinitionsById: { ...(source.parsedActorEffectDefinitionsById ?? {}) },
    actorEffectDefinitionErrorsById: { ...(source.actorEffectDefinitionErrorsById ?? {}) },
    effectDefinitionErrorsById: { ...(source.effectDefinitionErrorsById ?? {}) },
    effectImagePayloadsById: { ...(source.effectImagePayloadsById ?? {}) },
    targetLinkedEffectEvents: [...(source.targetLinkedEffectEvents ?? [])],
    unknownEntitySnapshots: [...(source.unknownEntitySnapshots ?? [])],
    combatEvents: [...(source.combatEvents ?? [])],
    worldEvents: [...(source.worldEvents ?? [])],
    combatEventSequence: Number.isInteger(source.combatEventSequence) ? source.combatEventSequence : 0,
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

function appendWorldEvent(world, opcode, packet) {
  const next = cloneWorld(world);
  next.worldEvents.push({ opcode, sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1, ...packet });
  if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
  return next;
}

function applyOpcode106Combat(world, packet) {
  const next = cloneWorld(world);
  const sequence = next.combatEventSequence + 1;
  for (const targetRecord of packet.targets) {
    const target = next.entitiesById[String(targetRecord.targetId)];
    if (target) {
      next.entitiesById[String(targetRecord.targetId)] = {
        ...target,
        currentHp: targetRecord.value,
      };
    }
  }
  const event = {
    sequence,
    opcode: 106,
    attackerEntityId: packet.sourceEntityId,
    actionByte: packet.actionByte,
    damage: packet.damageValue,
    effectBytes: [...packet.effectBytes],
    targets: packet.targets.map(target => ({ entityId: target.targetId, targetCurrentHp: target.value })),
    targetErrors: [...packet.targetErrors],
    trailingBytes: new Uint8Array(packet.trailingBytes),
  };
  next.combatEventSequence = sequence;
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
    case 10:
      event = decodeS2COpcode10(frame.payload);
      nextWorld = appendWorldEvent(world, 10, { first: event.firstShort, second: event.secondShort, valueA: event.firstInt, valueB: event.secondInt, trailingBytes: event.trailingBytes });
      break;
    case 83: {
      const reader = frame.payload;
      if (reader.length < 2) throw new RangeError("Opcode 83 payload is missing source entity id");
      const sourceId = (reader[0] << 8) | reader[1];
      const sourceEntityId = sourceId > 0x7fff ? sourceId - 0x10000 : sourceId;
      if (!world.entitiesById[String(sourceEntityId)]) {
        event = decodeS2COpcode83(frame.payload, false);
        nextWorld = appendWorldEvent(world, 83, {
          ...event, handledByOriginalGuard: false,
          opaquePayload: copyBytes(event.unconsumedBytes),
        });
        break;
      }
      event = decodeS2COpcode83(frame.payload, true);
      nextWorld = cloneWorld(world);
      for (const target of event.targets) {
        const existing = nextWorld.entitiesById[String(target.targetId)];
        if (existing) {
          nextWorld.entitiesById[String(target.targetId)] = {
            ...existing, opcode83State: { valueA: target.firstValue, valueB: target.secondValue },
          };
        }
      }
      nextWorld = appendWorldEvent(nextWorld, 83, event);
      break;
    }
    case 106:
      event = decodeS2COpcode106(frame.payload);
      nextWorld = applyOpcode106Combat(world, event);
      break;
    case -74: {
      event = decodeS2COpcodeMinus74(frame.payload);
      if (!event.handled) {
        nextWorld = appendWorldEvent(world, -74, {
          subcommand: event.subcommand,
          handled: false,
          unconsumedBytes: copyBytes(event.unconsumedBytes),
        });
        break;
      }
      nextWorld = cloneWorld(world);
      const target = nextWorld.entitiesById[String(event.entityId)];
      const entityKindMatches = target && target.kind === event.entityKind;
      if (entityKindMatches) {
        const activeEffects = [...(target.activeEffects ?? [])];
        const effect = {
          effectId: event.effectId,
          durationValue: event.durationValue,
          durationIsPositive: event.durationIsPositive,
          flagA: event.flagA,
          flagB: event.flagB,
          effectVariant: event.effectVariant,
        };
        activeEffects.push(effect);
        nextWorld.entitiesById[String(event.entityId)] = { ...target, activeEffects };
      }
      nextWorld = appendWorldEvent(nextWorld, -74, {
        ...event,
        attachedToKnownEntity: Boolean(entityKindMatches),
      });
      break;
    }
    case -71: {
      event = decodeS2COpcodeMinus71(frame.payload);
      nextWorld = cloneWorld(world);
      const target = nextWorld.entitiesById[String(event.entityId)];
      const entityKindMatches = target && target.kind === event.entityKind;
      let lifecycleApplied = false;
      if (event.action === 1 && entityKindMatches && (event.attachMode === 0 || event.attachMode === 1)) {
        const activeEffects = [...(target.activeEffects ?? [])];
        const effectIndex = activeEffects.findIndex(effect => effect.effectId === event.effectId);
        if (event.attachMode === 1) {
          if (effectIndex >= 0) {
            activeEffects[effectIndex] = { ...activeEffects[effectIndex], expiryValue: 0n };
            lifecycleApplied = true;
          }
        } else {
          const effect = {
            effectId: event.effectId,
            expiryValue: event.expiryValue,
            xTile: event.xTile,
            yTile: event.yTile,
            state: event.state,
            auxiliary: event.auxiliary,
          };
          if (effectIndex >= 0) activeEffects[effectIndex] = effect;
          else activeEffects.push(effect);
          lifecycleApplied = true;
        }
        if (lifecycleApplied) nextWorld.entitiesById[String(event.entityId)] = { ...target, activeEffects };
      }
      nextWorld = appendWorldEvent(nextWorld, -71, {
        ...event, lifecycleApplied: Boolean(lifecycleApplied),
        entityKindMatches: Boolean(entityKindMatches),
      });
      break;
    }
    case 26: {
      event = decodeS2COpcode26(frame.payload);
      nextWorld = cloneWorld(world);
      const definitionErrors = new Set((event.sectionErrors ?? []).map(item => item.section));
      // Source ka.case 26 loads indexedImages into i/hz.dj (target-linked actor catalog).
      if (!definitionErrors.has("indexedImages")) {
        for (const definition of event.indexedImages ?? []) {
          const key = String(definition.id);
          const bytes = copyBytes(definition.data);
          nextWorld.actorEffectDefinitionsById[key] = bytes;
          try {
            nextWorld.parsedActorEffectDefinitionsById[key] = decodeActorEffectDefinition(bytes);
            delete nextWorld.actorEffectDefinitionErrorsById[key];
          } catch (error) {
            delete nextWorld.parsedActorEffectDefinitionsById[key];
            nextWorld.actorEffectDefinitionErrorsById[key] = error.message;
          }
        }
      }
      if (!definitionErrors.has("indexedGraphics")) {
        for (const definition of event.indexedGraphics ?? []) {
          const key = String(definition.id);
          const bytes = copyBytes(definition.data);
          nextWorld.effectDefinitionsById[key] = bytes;
          try {
            nextWorld.parsedEffectDefinitionsById[key] = decodeEffectDefinition(bytes);
            delete nextWorld.effectDefinitionErrorsById[key];
          } catch (error) {
            delete nextWorld.parsedEffectDefinitionsById[key];
            nextWorld.effectDefinitionErrorsById[key] = error.message;
          }
        }
      }
      nextWorld = appendWorldEvent(nextWorld, 26, {
        templateCount: event.templateCount,
        actorEffectDefinitionCount: definitionErrors.has("indexedImages") ? 0 : (event.indexedImages?.length ?? 0),
        parsedActorEffectDefinitionCount: Object.keys(nextWorld.parsedActorEffectDefinitionsById).length,
        actorEffectDefinitionsError: definitionErrors.has("indexedImages"),
        effectDefinitionCount: definitionErrors.has("indexedGraphics") ? 0 : (event.indexedGraphics?.length ?? 0),
        parsedEffectDefinitionCount: Object.keys(nextWorld.parsedEffectDefinitionsById).length,
        indexedGraphicsError: definitionErrors.has("indexedGraphics"),
      });
      break;
    }
    case -51: {
      event = decodeS2COpcodeMinus51(frame.payload);
      nextWorld = cloneWorld(world);
      nextWorld.effectImagePayloadsById[String(event.resourceId)] = copyBytes(event.imageBytes);
      nextWorld = appendWorldEvent(nextWorld, -51, {
        resourceId: event.resourceId,
        imageByteLength: event.imageBytes.length,
      });
      break;
    }
    case -73: {
      event = decodeS2COpcodeMinus73(frame.payload);
      if (event.branch === 0) {
        nextWorld = cloneWorld(world);
        // Original mj.A resolves a separate hz actor by (source entity ID, kind 12).
        // That actor is not part of the regular entity-ID map yet, so retain the
        // target-linked action without pretending the source actor was resolved.
        const targets = event.targets.map(targetRecord => {
          const target = nextWorld.entitiesById[String(targetRecord.targetEntityId)];
          const resolved = Boolean(target && target.kind === targetRecord.entityKind);
          return { ...targetRecord, resolved };
        });
        const linkedEvent = {
          ...event,
          sequence: (nextWorld.targetLinkedEffectEvents.at(-1)?.sequence ?? 0) + 1,
          targets,
          resolvedTargetEntityIds: targets.filter(target => target.resolved).map(target => target.targetEntityId),
          effectActorResolved: false,
        };
        nextWorld.targetLinkedEffectEvents.push(linkedEvent);
        if (nextWorld.targetLinkedEffectEvents.length > 100) {
          nextWorld.targetLinkedEffectEvents.splice(0, nextWorld.targetLinkedEffectEvents.length - 100);
        }
        nextWorld = appendWorldEvent(nextWorld, -73, {
          ...event,
          handled: true,
          effectActorLookupSupported: false,
          resolvedTargetCount: targets.filter(target => target.resolved).length,
        });
        break;
      }
      if (event.branch === 1) {
        nextWorld = cloneWorld(world);
        const target = nextWorld.entitiesById[String(event.entityId)];
        let overlayApplied = false;
        if (target) {
          const effectOverlays = [...(target.effectOverlays ?? [])];
          const index = effectOverlays.findIndex(effect => effect.effectId === event.effectId);
          const overlay = { effectId: event.effectId, expiryValue: event.expiryValue };
          if (index >= 0) effectOverlays[index] = overlay;
          else effectOverlays.push(overlay);
          nextWorld.entitiesById[String(event.entityId)] = { ...target, effectOverlays };
          overlayApplied = true;
        }
        nextWorld = appendWorldEvent(nextWorld, -73, {
          ...event,
          handled: true,
          overlayApplied,
        });
        break;
      }
      nextWorld = appendWorldEvent(world, -73, {
        ...event,
        handled: false,
        unconsumedBytes: copyBytes(event.unconsumedBytes),
      });
      break;
    }
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
