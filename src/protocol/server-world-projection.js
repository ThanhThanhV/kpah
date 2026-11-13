import { resolveOriginalEntityFactoryClass } from "./original-entity-factory.js";

/**
 * Projects source-backed server entities into a Phaser diagnostic model.
 * Template metadata comes from S2C opcode 100; it is not an asset/sprite map.
 */
export function projectServerWorldEntities(world, localCharacterId = null) {
  if (!world || typeof world !== "object") return [];
  const entities = world.entitiesById ?? {};
  const templates = world.templatesById ?? {};
  const order = Array.isArray(world.entityOrder) ? world.entityOrder : [];
  const projected = [];
  for (const entityId of order) {
    const entity = entities[String(entityId)];
    if (!entity || entity.active === false) continue;
    const snapshot = entity.snapshot;
    const x = Number.isFinite(snapshot?.x) ? snapshot.x : entity.x;
    const y = Number.isFinite(snapshot?.y) ? snapshot.y : entity.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const kind = Number.isInteger(entity.kind) ? entity.kind : null;
    const templateId = Number.isInteger(snapshot?.templateId)
      ? snapshot.templateId
      : Number.isInteger(entity.templateId) ? entity.templateId : null;
    const template = templateId === null ? null : templates[String(templateId)] ?? null;
    projected.push({
      entityId,
      kind,
      isLocalPlayer: kind === 0 && Number.isInteger(localCharacterId) && entityId === localCharacterId,
      templateId,
      name: typeof snapshot?.name === "string" ? snapshot.name : null,
      templateName: template?.name ?? null,
      x,
      y,
      state: Number.isInteger(entity.state) ? entity.state : null,
      marker: Number.isInteger(entity.marker) ? entity.marker : null,
      targetX: Number.isFinite(entity.targetX) ? entity.targetX : null,
      targetY: Number.isFinite(entity.targetY) ? entity.targetY : null,
      movementPending: entity.movementPending === true,
      playerMovementStep: Number.isFinite(snapshot?.cT) ? snapshot.cT : 3,
      coordinateSource: Number.isFinite(snapshot?.x) && Number.isFinite(snapshot?.y)
        ? "opcode5" : "opcode4",
      presentation: kind === 0 ? "player-like" : kind === 1 ? "monster-npc-family" : "unknown-kind",
      factoryClass: resolveOriginalEntityFactoryClass(kind, templateId, entity.state, kind === 0 ? entity.marker : (entity.kind1Subtype ?? -1)),
      frameWidth: template?.frameWidth ?? null,
      frameHeight: template?.frameHeight ?? null,
      movementStep: template?.movementStep ?? null,
      templateType: template?.directionFrameType ?? null,
      frameOffsetX: template?.frameOffsetX ?? null,
      frameOffsetY: template?.frameOffsetY ?? null,
      shadowOffsetX: template?.shadowOffsetX ?? null,
      shadowOffsetY: template?.shadowOffsetY ?? null,
      templateReady: template !== null,
    });
  }
  return projected;
}
