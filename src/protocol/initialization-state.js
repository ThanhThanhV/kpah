/**
 * Applies verified S2C opcode 16 initialization snapshots to client-side state.
 * This pure reducer does not open a socket, persist data, or claim server acceptance.
 */
export function createInitializationState() {
  return {
    currency: null,
    resourcesByIndex: {},
    inventory: [],
    auxiliaryItems: [],
    counterValues: [],
    commonFields: { aY: null, aZ: null },
  };
}

function copyRecords(records, fieldName) {
  if (!Array.isArray(records)) throw new TypeError("Expected " + fieldName + " to be an array");
  return records.map(record => ({ ...record }));
}

export function applyOpcode16(state, packet) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!packet || packet.decoded !== true) return state;

  const next = {
    ...state,
    resourcesByIndex: { ...state.resourcesByIndex },
    commonFields: { ...state.commonFields },
  };

  switch (packet.mode) {
    case 0: {
      if (typeof packet.currency !== "bigint") throw new TypeError("Opcode 16 mode 0 currency must be bigint");
      if (!Array.isArray(packet.resources)) throw new TypeError("Opcode 16 mode 0 resources must be an array");
      next.currency = packet.currency;
      for (const resource of packet.resources) {
        if (!Number.isInteger(resource.resourceIndex) || resource.resourceIndex < 0 || resource.resourceIndex > 255) {
          throw new RangeError("Opcode 16 resource index must be an unsigned byte");
        }
        if (!Number.isInteger(resource.resourceAmount)) throw new TypeError("Opcode 16 resource amount must be an integer");
        next.resourcesByIndex[resource.resourceIndex] = resource.resourceAmount;
      }
      break;
    }
    case 1:
      // Original handler clears and replaces the complete inventory vector.
      next.inventory = copyRecords(packet.items, "inventory items");
      break;
    case 2:
      // Original shared-state callback retains the second k collection as z.by.
      // The first collection is parsed but is not retained.
      next.auxiliaryItems = copyRecords(packet.secondCollection, "auxiliary items");
      break;
    case 3:
      if (!Array.isArray(packet.counterValues)) throw new TypeError("Opcode 16 mode 3 counters must be an array");
      next.counterValues = [...packet.counterValues];
      break;
    default:
      return state;
  }

  if (Number.isInteger(packet.aY)) next.commonFields.aY = packet.aY;
  if (Number.isInteger(packet.aZ)) next.commonFields.aZ = packet.aZ;
  return next;
}

/**
 * Applies the global catalogs/configuration decoded from S2C opcode 1.
 * Catalog indices and opaque byte blobs are preserved exactly as received.
 */
export function applyOpcode1(state, packet) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!packet || !Array.isArray(packet.skills) || !Array.isArray(packet.professionSkillCatalogs)) {
    throw new TypeError("Decoded opcode 1 packet is required");
  }
  if (!Array.isArray(packet.tileBlobs) || !Array.isArray(packet.partData)) {
    throw new TypeError("Opcode 1 tile and part data arrays are required");
  }

  const cloneBytes = value => {
    if (!(value instanceof Uint8Array)) throw new TypeError("Expected opcode 1 binary data as Uint8Array");
    return new Uint8Array(value);
  };
  const cloneRecords = (records, field) => {
    if (!Array.isArray(records)) throw new TypeError("Expected " + field + " to be an array");
    return records.map(record => ({ ...record }));
  };

  return {
    ...state,
    globalConfig: {
      wireMovementStep: packet.wireMovementStep,
      movementStep: packet.movementStep,
      boatTicketPrice: packet.boatTicketPrice,
      globalConfigBytes: [...packet.globalConfigBytes],
      optionalBlock: packet.optionalBlock == null ? null : {
        auxiliaryShort: packet.optionalBlock.auxiliaryShort,
        unlockedIds: [...packet.optionalBlock.unlockedIds],
        matrices: packet.optionalBlock.matrices.map(row => row.map(cell => [...cell])),
      },
      supportHotline: packet.supportHotline,
      externalUrl: packet.externalUrl,
      partDataFlag: packet.partDataFlag,
      partDataError: packet.partDataError ?? null,
      trailingBytes: cloneBytes(packet.trailingBytes),
    },
    skillCatalog: cloneRecords(packet.skills, "skills"),
    professionSkillSlotCounts: [...packet.professionSkillSlotCounts],
    professionSkillCatalogs: packet.professionSkillCatalogs.map((records, index) =>
      cloneRecords(records, "profession skill catalog " + index)),
    statLabels: cloneRecords(packet.statLabels, "stat labels"),
    pairedLookupRows: cloneRecords(packet.pairedLookupRows, "paired lookup rows"),
    questObjectives: cloneRecords(packet.questObjectives, "quest objectives"),
    tileBlobs: packet.tileBlobs.map(blob => ({
      index: blob.index, key: blob.key, data: cloneBytes(blob.data),
    })),
    partData: packet.partData.map(blob => ({
      index: blob.index, data: cloneBytes(blob.data),
    })),
  };
}


/**
 * Stores only completely parsed opcode 3 extension groups under their wire character id.
 * Group names remain neutral until the original handler establishes business meaning.
 */
export function applyOpcode3Extension(state, packet) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!packet || !packet.main || packet.main.error || !Number.isInteger(packet.main.i) || packet.main.i === -1) {
    return state;
  }

  const characterId = packet.main.i;
  const previous = state.characterExtensionsById?.[characterId] ?? {};
  const nextExtension = { ...previous, main: { ...packet.main } };
  const parsedGroups = [
    ["pairA", "pairAParsed"],
    ["tripleB", "tripleBParsed"],
    ["tripleC", "tripleCParsed"],
    ["mapping", "mappingApplied"],
    ["groupD", "groupDParsed"],
    ["groupE", "groupEParsed"],
  ];
  for (const [field, parsedFlag] of parsedGroups) {
    if (packet[parsedFlag] === true) {
      const value = packet[field];
      nextExtension[field] = Array.isArray(value)
        ? [...value]
        : value && typeof value === "object" ? { ...value } : value;
    }
  }
  if (packet.bfParsed === true) nextExtension.bf = packet.bf;
  if (packet.mappingError != null) nextExtension.mappingError = packet.mappingError;
  if (packet.trailingBytes instanceof Uint8Array) nextExtension.trailingBytes = new Uint8Array(packet.trailingBytes);

  const nextCharacter = {
    ...(state.charactersById?.[characterId] ?? {}),
    extension: nextExtension,
  };
  return {
    ...state,
    characterExtensionsById: {
      ...(state.characterExtensionsById ?? {}),
      [characterId]: nextExtension,
    },
    charactersById: {
      ...(state.charactersById ?? {}),
      [characterId]: nextCharacter,
    },
  };
}


/**
 * Applies the two source-backed S2C opcode 15 variants without interpreting
 * item fields or image bytes beyond the decoder's verified framing.
 */
export function applyOpcode15(state, packet) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!packet || packet.accepted !== true || !Number.isInteger(packet.targetCharacterId)) return state;
  if (!Array.isArray(packet.items)) throw new TypeError("Opcode 15 items must be an array");

  const cloneItems = () => packet.items.map(item => ({
    ...item,
    stats: Array.isArray(item.stats) ? item.stats.map(stat => ({ ...stat })) : [],
  }));
  const characterId = packet.targetCharacterId;
  const previous = state.opcode15ByCharacterId?.[characterId] ?? {};

  let nextCharacter;
  if (packet.subtype === 0) {
    if (!Array.isArray(packet.shortValues) || packet.shortValues.length !== 5) {
      throw new TypeError("Opcode 15 subtype 0 requires five short values");
    }
    nextCharacter = {
      ...previous,
      shopContext: {
        items: cloneItems(),
        aS: packet.aS,
        shortValues: [...packet.shortValues],
        optionalTextSentinel: packet.optionalTextSentinel,
        optionalText: packet.optionalText ?? null,
        optionalTextValue: packet.optionalTextValue,
        optionalContextSentinel: packet.optionalContextSentinel,
        optionalContext: packet.optionalContext == null ? null : { ...packet.optionalContext },
        trailingBytes: packet.trailingBytes instanceof Uint8Array
          ? new Uint8Array(packet.trailingBytes) : new Uint8Array(),
      },
    };
  } else {
    if (!(packet.imageBytes instanceof Uint8Array)) {
      throw new TypeError("Opcode 15 image bytes must be Uint8Array");
    }
    if (!Number.isInteger(packet.frameCount)) throw new TypeError("Opcode 15 frame count is required");
    nextCharacter = {
      ...previous,
      petEquipmentImage: {
        items: cloneItems(),
        frameCount: packet.frameCount,
        atlasLayoutCode: packet.atlasLayoutCode,
        imageBytes: new Uint8Array(packet.imageBytes),
      },
    };
  }

  return {
    ...state,
    opcode15ByCharacterId: {
      ...(state.opcode15ByCharacterId ?? {}),
      [characterId]: nextCharacter,
    },
  };
}


/**
 * Applies the verified fixed prefix of S2C opcode 3. The unparsed extension
 * remains opaque here and is handled only by the dedicated extension decoder.
 */
export function applyOpcode3Snapshot(state, decodedPrefix) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!decodedPrefix || !decodedPrefix.fields || !Number.isInteger(decodedPrefix.fields.characterId)) return state;
  if (!(decodedPrefix.trailingBytes instanceof Uint8Array)) {
    throw new TypeError("Opcode 3 trailing bytes must be Uint8Array");
  }
  const characterId = decodedPrefix.fields.characterId;
  const snapshot = {
    fields: {
      ...decodedPrefix.fields,
      actionMapping: decodedPrefix.fields.actionMapping instanceof Uint8Array
        ? new Uint8Array(decodedPrefix.fields.actionMapping) : decodedPrefix.fields.actionMapping,
    },
    trailingBytes: new Uint8Array(decodedPrefix.trailingBytes),
    decodedPrefixBytes: decodedPrefix.decodedPrefixBytes,
  };
  return {
    ...state,
    characterSnapshotsById: {
      ...(state.characterSnapshotsById ?? {}),
      [characterId]: snapshot,
    },
    charactersById: {
      ...(state.charactersById ?? {}),
      [characterId]: {
        ...(state.charactersById?.[characterId] ?? {}),
        snapshot,
      },
    },
  };
}

/**
 * Single explicit event entry point for the currently implemented initialization
 * reducers. The event type distinguishes opcode 3's fixed prefix from its
 * independently guarded extension payload.
 */
export function applyInitializationEvent(state, event) {
  if (!state || typeof state !== "object") throw new TypeError("Initialization state is required");
  if (!event || typeof event.type !== "string") return state;
  switch (event.type) {
    case "S2C_OPCODE_1": return applyOpcode1(state, event.packet);
    case "S2C_OPCODE_3_SNAPSHOT": return applyOpcode3Snapshot(state, event.packet);
    case "S2C_OPCODE_3_EXTENSION": return applyOpcode3Extension(state, event.packet);
    case "S2C_OPCODE_15": return applyOpcode15(state, event.packet);
    case "S2C_OPCODE_16": return applyOpcode16(state, event.packet);
    default: return state;
  }
}
