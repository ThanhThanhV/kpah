import Phaser from 'phaser';

/**
 * Runtime helpers for the original game's scrolling world.
 * Tile IDs and tileset mappings must come from verified KPAH resources;
 * this module deliberately does not invent either.
 */

export function setWorldEntityDepth(entity, groundOffset = 0) {
  if (!entity || !Number.isFinite(entity.y)) return;
  entity.setDepth(Math.round(entity.y + groundOffset));
}

export function configureWorldCamera(scene, target, bounds, options = {}) {
  const camera = scene.cameras.main;
  const world = {
    x: Number(bounds?.x ?? 0),
    y: Number(bounds?.y ?? 0),
    width: Number(bounds?.width),
    height: Number(bounds?.height)
  };
  if (!(world.width > 0 && world.height > 0)) {
    throw new Error('World camera requires positive map width and height.');
  }

  camera.setBounds(world.x, world.y, world.width, world.height);
  camera.setRoundPixels(options.roundPixels !== false);
  if (target) {
    camera.startFollow(
      target,
      true,
      Phaser.Math.Clamp(options.lerpX ?? 0.12, 0.01, 1),
      Phaser.Math.Clamp(options.lerpY ?? 0.12, 0.01, 1)
    );
    if (options.deadzone) {
      camera.setDeadzone(
        Math.max(1, options.deadzone.width | 0),
        Math.max(1, options.deadzone.height | 0)
      );
    }
  }
  return camera;
}

export function moveWorldEntity(scene, entity, destination, options = {}) {
  if (!scene || !entity || !destination) return null;
  const bounds = options.bounds;
  const x = bounds
    ? Phaser.Math.Clamp(destination.x, bounds.x, bounds.x + bounds.width)
    : destination.x;
  const y = bounds
    ? Phaser.Math.Clamp(destination.y, bounds.y, bounds.y + bounds.height)
    : destination.y;
  const duration = Phaser.Math.Clamp(options.duration ?? 120, 0, 5000);

  scene.tweens.killTweensOf(entity);
  return scene.tweens.add({
    targets: entity,
    x,
    y,
    duration,
    ease: options.ease || 'Sine.easeOut',
    onUpdate: () => setWorldEntityDepth(entity, options.depthOffset || 0),
    onComplete: () => {
      setWorldEntityDepth(entity, options.depthOffset || 0);
      options.onComplete?.();
    }
  });
}

/**
 * Adapter for a verified row-major tile matrix and a Phaser spritesheet.
 * The caller supplies source-derived tile IDs and dimensions.
 */
export function createWorldTileLayer(scene, definition) {
  const { key, data, tileWidth, tileHeight } = definition || {};
  if (typeof key !== 'string' || !key || !scene.textures.exists(key)) {
    throw new Error('World tileset texture is missing: ' + String(key));
  }
  if (!Array.isArray(data) || !data.length || !data.every(row =>
    Array.isArray(row) && row.length === data[0].length &&
    row.every(tile => Number.isInteger(tile) && tile >= -1)
  )) {
    throw new Error('World tile data must be a non-empty rectangular integer matrix.');
  }
  if (!(Number.isInteger(tileWidth) && tileWidth > 0 &&
        Number.isInteger(tileHeight) && tileHeight > 0)) {
    throw new Error('World tile dimensions must be positive integers.');
  }

  const map = scene.make.tilemap({ data, tileWidth, tileHeight });
  const tileset = map.addTilesetImage(key, key, tileWidth, tileHeight, 0, 0);
  if (!tileset) throw new Error('Unable to bind world tileset: ' + key);
  const layer = map.createLayer(0, tileset, definition.x || 0, definition.y || 0);
  if (Array.isArray(definition.collisions) && definition.collisions.length) {
    map.setCollision(definition.collisions, true, layer);
  }
  layer.setDepth(definition.depth || 0);
  return { map, layer };
}
