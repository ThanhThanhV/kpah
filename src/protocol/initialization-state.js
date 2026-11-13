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
