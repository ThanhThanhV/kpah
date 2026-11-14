import { decodeS2COpcode4, decodeS2COpcode6, decodeS2COpcode8, decodeS2COpcode9, decodeS2COpcode10, decodeS2COpcode7, decodeS2COpcode32, decodeS2COpcode33, decodeS2COpcode60, decodeS2COpcode83, decodeS2COpcode106, decodeS2COpcodeMinus74, decodeS2COpcodeMinus71, decodeS2COpcodeMinus73, decodeS2COpcodeMinus51, decodeS2COpcode26, decodeS2COpcode15 } from "./generated/world-state-codec.js";
import { decodeS2COpcode5 } from "./generated/opcode5-codec.js";
import { decodeS2CTemplateCatalog, decodeS2CTemplateAsset } from "./template-assets.js";
import { decodeEffectDefinition } from "./effect-definition.js";
import { decodeActorEffectDefinition } from "./actor-effect-definition.js";

export function createServerWorldState() {
  return {
    entitiesById: {},
    entityOrder: [],
    characterResourcesById: {},
    characterLevelsById: {},
    characterRevivesById: {},
    templatesById: {},
    templateAssetPayloadsById: {},
    effectDefinitionsById: {},
    parsedEffectDefinitionsById: {},
    actorEffectDefinitionsById: {},
    parsedActorEffectDefinitionsById: {},
    actorEffectDefinitionErrorsById: {},
    effectDefinitionErrorsById: {},
    effectImagePayloadsById: {},
    resourceImagePayloadsById: {},
    targetLinkedEffectEvents: [],
    worldEffects: [],
    targetLinkedActorsBySourceId: {},
    targetLinkedActorSpawnSequence: 0,
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
    characterResourcesById: { ...(source.characterResourcesById ?? {}) },
    characterLevelsById: { ...(source.characterLevelsById ?? {}) },
    characterRevivesById: { ...(source.characterRevivesById ?? {}) },
    templatesById: { ...(source.templatesById ?? {}) },
    templateAssetPayloadsById: { ...(source.templateAssetPayloadsById ?? {}) },
    effectDefinitionsById: { ...(source.effectDefinitionsById ?? {}) },
    parsedEffectDefinitionsById: { ...(source.parsedEffectDefinitionsById ?? {}) },
    actorEffectDefinitionsById: { ...(source.actorEffectDefinitionsById ?? {}) },
    parsedActorEffectDefinitionsById: { ...(source.parsedActorEffectDefinitionsById ?? {}) },
    actorEffectDefinitionErrorsById: { ...(source.actorEffectDefinitionErrorsById ?? {}) },
    effectDefinitionErrorsById: { ...(source.effectDefinitionErrorsById ?? {}) },
    effectImagePayloadsById: { ...(source.effectImagePayloadsById ?? {}) },
    resourceImagePayloadsById: { ...(source.resourceImagePayloadsById ?? source.effectImagePayloadsById ?? {}) },
    targetLinkedEffectEvents: [...(source.targetLinkedEffectEvents ?? [])],
    worldEffects: [...(source.worldEffects ?? [])],
    targetLinkedActorsBySourceId: { ...(source.targetLinkedActorsBySourceId ?? {}) },
    unknownEntitySnapshots: [...(source.unknownEntitySnapshots ?? [])],
    combatEvents: [...(source.combatEvents ?? [])],
    worldEvents: [...(source.worldEvents ?? [])],
    combatEventSequence: Number.isInteger(source.combatEventSequence) ? source.combatEventSequence : 0,
    targetLinkedActorSpawnSequence: Number.isInteger(source.targetLinkedActorSpawnSequence) ? source.targetLinkedActorSpawnSequence : 0,
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
  const entity = next.entitiesById[String(snapshot.entityId)];
  const combatState = Array.isArray(snapshot.combatState) ? snapshot.combatState : [];
  const stateBytes = Array.isArray(snapshot.stateBytes) ? snapshot.stateBytes : [];
  next.entitiesById[String(snapshot.entityId)] = {
    ...entity,
    snapshot,
    ...(Number.isFinite(combatState[0]) ? { currentHp: combatState[0] } : {}),
    ...(Number.isFinite(combatState[1]) ? { maxHp: combatState[1] } : {}),
    ...(Number.isFinite(combatState[2]) ? { currentMp: combatState[2] } : {}),
    ...(Number.isFinite(combatState[3]) ? { maxMp: combatState[3] } : {}),
    ...(Number.isInteger(stateBytes[0]) ? { level: stateBytes[0] } : {}),
  };
  return next;
}

/**
 * Opcode 32 is a keyed resource update for an existing kind-0 player.
 * hp/mp update current HP/MP only; bp/sp update auxiliary resource fields.
 * Preserve the local-only trailer and all source key/value records.
 */
function applyCharacterResources(world, packet) {
  const next = cloneWorld(world);
  const id = String(packet.characterId);
  const entity = next.entitiesById[id];
  if (entity?.kind !== 0) {
    next.worldEvents.push({
      opcode: 32,
      sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
      characterId: packet.characterId,
      entityResolved: false,
    });
    if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
    return next;
  }
  const previous = next.characterResourcesById[id] ?? { statsByKey: {} };
  const statsByKey = { ...(previous.statsByKey ?? {}) };
  for (const record of packet.stats ?? []) {
    if (typeof record.key !== "string" || !record.key.trim() || !Number.isFinite(record.value)) continue;
    const key = record.key.trim();
    statsByKey[key.toLowerCase()] = { key, value: record.value };
  }
  next.characterResourcesById[id] = {
    ...previous,
    stats: (packet.stats ?? []).map(record => ({ ...record })),
    statsByKey,
    localStateByte: Number.isInteger(packet.localStateByte) ? packet.localStateByte : previous.localStateByte ?? null,
    localShortValue: Number.isInteger(packet.localShortValue) ? packet.localShortValue : previous.localShortValue ?? null,
  };
  const hp = statsByKey.hp?.value;
  const mp = statsByKey.mp?.value;
  next.entitiesById[id] = {
    ...entity,
    ...(Number.isFinite(hp) ? { currentHp: hp } : {}),
    ...(Number.isFinite(mp) ? { currentMp: mp } : {}),
  };
  next.worldEvents.push({
    opcode: 32,
    sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
    characterId: packet.characterId,
    entityResolved: true,
  });
  if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
  return next;
}

/**
 * Opcode 33 matches mj.a(short, byte, int, int): it updates an existing
 * kind-0 player entity, setting HP current/max from valueA and MP current/max
 * from valueB. The original handler is a no-op when the player entity is absent.
 */
function applyCharacterRevive(world, packet, activeCharacterId = null) {
  const next = cloneWorld(world);
  const id = String(packet.characterId), entity = next.entitiesById[id];
  const isLocal = Number.isInteger(activeCharacterId) && activeCharacterId === packet.characterId;
  const resolved = entity?.kind === 0 || isLocal;
  if (entity?.kind === 0) next.entitiesById[id] = {
    ...entity, currentHp: packet.currentHp, maxHp: packet.maxHp,
    maxMp: packet.maxMp, reviveAuxiliary: packet.auxiliaryShort,
  };
  next.characterRevivesById[id] = {
    maxHp: packet.maxHp, maxMp: packet.maxMp,
    currentHp: packet.currentHp, auxiliaryShort: packet.auxiliaryShort,
  };
  next.worldEvents.push({
    opcode: 60, sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
    characterId: packet.characterId, entityId: resolved ? packet.characterId : null,
    currentHp: packet.currentHp, entityResolved: resolved, eventType: "revive", isLocal,
    x: Number.isFinite(entity?.x) ? entity.x : entity?.snapshot?.x,
    y: Number.isFinite(entity?.y) ? entity.y : entity?.snapshot?.y,
  });
  if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
  return next;
}

function applyCharacterLevel(world, packet) {
  const next = cloneWorld(world);
  const id = String(packet.characterId);
  const entity = next.entitiesById[id];
  if (entity?.kind !== 0) {
    next.worldEvents.push({
      opcode: 33,
      sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
      characterId: packet.characterId,
      entityResolved: false,
    });
    if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
    return next;
  }
  next.characterLevelsById[id] = { level: packet.level };
  next.entitiesById[id] = {
    ...entity,
    currentHp: packet.valueA,
    maxHp: packet.valueA,
    currentMp: packet.valueB,
    maxMp: packet.valueB,
    level: packet.level,
  };
  next.worldEvents.push({
    opcode: 33,
    sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
    characterId: packet.characterId,
    entityId: packet.characterId,
    level: packet.level,
    x: Number.isFinite(entity.x) ? entity.x : entity.snapshot?.x,
    y: Number.isFinite(entity.y) ? entity.y : entity.snapshot?.y,
    entityResolved: true,
    eventType: "level-up",
  });
  if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
  return next;
}

/**
 * Opcode 7 resolves an already-existing entity through mj.a(ce); it never
 * creates one. HP values are source-confirmed, while the other fields remain
 * grouped as an opaque state update until their rendering semantics are traced.
 */
function applyS2COpcode7World(world, packet) {
  const next = cloneWorld(world);
  const id = String(packet.entityId);
  const entity = next.entitiesById[id];
  if (!entity) {
    next.worldEvents.push({
      opcode: 7,
      sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
      entityId: packet.entityId,
      entityResolved: false,
    });
    if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
    return next;
  }
  next.entitiesById[id] = {
    ...entity,
    currentHp: packet.currentHp,
    maxHp: packet.maxHp,
    opcode7State: {
      templateId: packet.templateId,
      x: packet.x,
      y: packet.y,
      stateByteD: packet.stateByteD,
      stateByteI: packet.stateByteI,
      opaqueInt: packet.opaqueInt,
    },
  };
  next.worldEvents.push({
    opcode: 7,
    sequence: (next.worldEvents.at(-1)?.sequence ?? 0) + 1,
    entityId: packet.entityId,
    entityResolved: true,
  });
  if (next.worldEvents.length > 100) next.worldEvents.splice(0, next.worldEvents.length - 100);
  return next;
}

export function applyS2COpcode8World(world, packet) {
  if (!packet || !Array.isArray(packet.entityIds)) throw new TypeError("Opcode 8 entityIds must be an array");
  const next = cloneWorld(world);
  const removed = new Set(packet.entityIds);
  for (const id of packet.entityIds) { delete next.entitiesById[String(id)]; delete next.targetLinkedActorsBySourceId[String(id)]; }
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
 * Mirrors the client-side effect of hz.b() after its seven-tick approach:
 * bu.f(int) assigns the supplied target HP directly to cG.
 */
export function applyTargetLinkedActorImpactToWorld(world, impact) {
  const next = cloneWorld(world);
  for (const target of impact?.targets ?? []) {
    if (!Number.isInteger(target.entityId) || !Number.isFinite(target.targetCurrentHp)) continue;
    const key = String(target.entityId), entity = next.entitiesById[key];
    if (entity) {
      let updated = { ...entity, currentHp: target.targetCurrentHp };
      if (Number.isInteger(impact.effectId)) {
        const overlays = [...(entity.effectOverlays ?? [])];
        const index = overlays.findIndex(effect => effect.effectId === impact.effectId);
        const overlay = { effectId: impact.effectId, expiryValue: 0n };
        if (index >= 0) overlays[index] = { ...overlays[index], expiryValue: 0n };
        else overlays.push(overlay);
        updated = { ...updated, effectOverlays: overlays };
      }
      next.entitiesById[key] = updated;
    }
  }
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
export function applyInboundWorldPacket(state, frame, nowMs = Date.now()) {
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
    case 32: {
      const characterId = frame.payload.length >= 2
        ? ((frame.payload[0] << 8) | frame.payload[1]) > 0x7fff
          ? ((frame.payload[0] << 8) | frame.payload[1]) - 0x10000
          : ((frame.payload[0] << 8) | frame.payload[1])
        : null;
      event = decodeS2COpcode32(frame.payload, Number.isInteger(state.activeCharacterId)
        && characterId === state.activeCharacterId);
      nextWorld = applyCharacterResources(world, event);
      break;
    }
    case 33:
      event = decodeS2COpcode33(frame.payload);
      nextWorld = applyCharacterLevel(world, event);
      break;
    case 60:
      event = decodeS2COpcode60(frame.payload);
      nextWorld = applyCharacterRevive(world, event, state.activeCharacterId);
      break;
    case 7:
      event = decodeS2COpcode7(frame.payload);
      nextWorld = applyS2COpcode7World(world, event);
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
    case 15: {
      event = decodeS2COpcode15(frame.payload);
      nextWorld = cloneWorld(world);
      if (event.mode === 0 && Number.isInteger(event.shopId) && event.auxiliary) {
        const sourceId = String(event.shopId);
        const source = nextWorld.entitiesById[sourceId];
        if (source?.kind === 0) {
          // ka.case 15 creates l (kind 12); mj.a(l,z) turns R=5 into hz(z,S).
          // The animation ID is auxiliary.fieldS, not the later -73 effect ID.
          if (event.auxiliary.fieldR === 5 && Number.isInteger(event.auxiliary.fieldS)) {
            const sequence = nextWorld.targetLinkedActorSpawnSequence + 1;
            nextWorld.targetLinkedActorSpawnSequence = sequence;
            nextWorld.targetLinkedActorsBySourceId[sourceId] = {
              sourceEntityId: event.shopId, animationId: event.auxiliary.fieldS,
              spawnSequence: sequence, auxiliaryFieldM: event.auxiliary.fieldM,
            };
          } else delete nextWorld.targetLinkedActorsBySourceId[sourceId];
        }
      }
      nextWorld = appendWorldEvent(nextWorld, 15, {
        mode: event.mode, sourceEntityId: event.mode === 0 ? event.shopId : null,
        targetLinkedActorCreated: Boolean(event.mode === 0 && event.auxiliary?.fieldR === 5 && nextWorld.targetLinkedActorsBySourceId[String(event.shopId)]),
        animationId: event.mode === 0 && event.auxiliary?.fieldR === 5 ? nextWorld.targetLinkedActorsBySourceId[String(event.shopId)]?.animationId ?? null : null,
      });
      break;
    }
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
      let overlayApplied = false;
      let expiryValue = null;
      if (entityKindMatches) {
        if (!Number.isFinite(nowMs)) throw new TypeError("Opcode -74 receive time must be finite");
        expiryValue = event.durationValue > 0 ? BigInt(Math.trunc(nowMs) + event.durationValue) : 0n;
        const effectOverlays = [...(target.effectOverlays ?? [])];
        const index = effectOverlays.findIndex(effect => effect.effectId === event.effectId);
        if (index >= 0) {
          // bu.a(effectId,...,expiry,flags,...) refreshes only d.l on an
          // existing ID; constructor flags/variant/random hold stay intact.
          effectOverlays[index] = { ...effectOverlays[index], expiryValue };
        } else {
          effectOverlays.push({
            effectId: event.effectId,
            expiryValue,
            flagA: event.flagA,
            flagB: event.flagB,
            effectVariant: event.effectVariant,
            loopHoldSeconds: 1 + Math.floor(Math.random() * 7),
          });
        }
        nextWorld.entitiesById[String(event.entityId)] = { ...target, effectOverlays };
        overlayApplied = true;
      }
      nextWorld = appendWorldEvent(nextWorld, -74, {
        ...event,
        expiryValue,
        overlayApplied,
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
      let worldEffectAdded = false;
      // mj.B routes action 1 to bu.df (attachMode 0) or bu.de (nonzero).
      // State 0 adds if absent; state 1 sets expiry to zero on an existing record.
      if (event.action === 1 && entityKindMatches) {
        const collectionName = event.attachMode === 0 ? "activeEffects" : "attachedEffects";
        const effects = [...(target[collectionName] ?? [])];
        const effectIndex = effects.findIndex(effect => effect.effectId === event.effectId);
        if (effectIndex >= 0) {
          if (event.state === 1) { effects[effectIndex] = { ...effects[effectIndex], expiryValue: 0n }; lifecycleApplied = true; }
        } else if (event.state === 0) {
          effects.push({ effectId: event.effectId, expiryValue: event.expiryValue,
            x: event.xTile << 4, y: event.yTile << 4, entityKind: event.entityKind,
            state: event.state, auxiliary: event.auxiliary });
          lifecycleApplied = true;
        }
        if (lifecycleApplied) nextWorld.entitiesById[String(event.entityId)] = { ...target, [collectionName]: effects };
      }
      // Action 0 or a short entity ID > 32000 creates a world effect object.
      if (event.action === 0 || event.entityId > 32000) {
        nextWorld.worldEffects.push({ effectId: event.effectId, expiryValue: event.expiryValue,
          entityId: event.entityId, entityKind: event.entityKind,
          x: entityKindMatches ? target.x : event.xTile << 4,
          y: entityKindMatches ? target.y : event.yTile << 4, state: event.state, auxiliary: event.auxiliary });
        worldEffectAdded = true;
      }
      nextWorld = appendWorldEvent(nextWorld, -71, { ...event, lifecycleApplied, worldEffectAdded,
        entityKindMatches: Boolean(entityKindMatches) });
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
      nextWorld.resourceImagePayloadsById[String(event.resourceId)] = copyBytes(event.imageBytes);
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
          animationId: nextWorld.targetLinkedActorsBySourceId[String(event.sourceEntityId)]?.animationId ?? null,
          actorSpawnSequence: nextWorld.targetLinkedActorsBySourceId[String(event.sourceEntityId)]?.spawnSequence ?? null,
          targets,
          resolvedTargetEntityIds: targets.filter(target => target.resolved).map(target => target.targetEntityId),
          effectActorResolved: Number.isInteger(nextWorld.targetLinkedActorsBySourceId[String(event.sourceEntityId)]?.animationId),
        };
        nextWorld.targetLinkedEffectEvents.push(linkedEvent);
        if (nextWorld.targetLinkedEffectEvents.length > 100) {
          nextWorld.targetLinkedEffectEvents.splice(0, nextWorld.targetLinkedEffectEvents.length - 100);
        }
        nextWorld = appendWorldEvent(nextWorld, -73, {
          ...event,
          handled: true,
          effectActorLookupSupported: Number.isInteger(linkedEvent.animationId),
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
          if (index >= 0) effectOverlays[index] = { ...effectOverlays[index], expiryValue: event.expiryValue };
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
