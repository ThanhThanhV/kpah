/**
 * Projects only source-backed coordinates and identifiers into a neutral
 * Phaser-facing diagnostic model. It deliberately does not resolve templates
 * to original sprites or infer animation/speed from template IDs.
 */
export function projectServerWorldEntities(world) {
  if (!world || typeof world !== "object") return [];
  const entities = world.entitiesById ?? {};
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
    projected.push({
      entityId,
      kind,
      templateId: Number.isInteger(snapshot?.templateId)
        ? snapshot.templateId
        : Number.isInteger(entity.templateId) ? entity.templateId : null,
      x,
      y,
      state: Number.isInteger(entity.state) ? entity.state : null,
      coordinateSource: Number.isFinite(snapshot?.x) && Number.isFinite(snapshot?.y)
        ? "opcode5" : "opcode4",
      presentation: kind === 0 ? "player-like" : kind === 1 ? "monster-npc-family" : "unknown-kind",
    });
  }
  return projected;
}
