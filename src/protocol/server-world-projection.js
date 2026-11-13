import { resolveOriginalEntityFactoryClass } from "./original-entity-factory.js";

/**
 * Projects source-backed server entities into a Phaser diagnostic model.
 * Template metadata comes from S2C opcode 100; it is not an asset/sprite map.
 */
export function projectServerWorldEntities(world) {
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
      templateId,
      templateName: template?.name ?? null,
      x,
      y,
      state: Number.isInteger(entity.state) ? entity.state : null,
      coordinateSource: Number.isFinite(snapshot?.x) && Number.isFinite(snapshot?.y)
        ? "opcode5" : "opcode4",
      presentation: kind === 0 ? "player-like" : kind === 1 ? "monster-npc-family" : "unknown-kind",
      factoryClass: resolveOriginalEntityFactoryClass(kind, templateId, entity.state, entity.kind1Subtype),
      frameWidth: template?.frameWidth ?? null,
      frameHeight: template?.frameHeight ?? null,
      movementStep: template?.movementStep ?? null,
      templateReady: template !== null,
    });
  }
  return projected;
}
