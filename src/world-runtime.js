import Phaser from 'phaser';
import { setCameraFollowTarget } from './protocol/camera-follow.js';

/**
 * Runtime helpers for the original game's scrolling world.
 * Tile IDs and tileset mappings must come from verified KPAH resources;
 * this module deliberately does not invent either.
 */

export function setWorldEntityDepth(entity, groundOffset = 0) {
  if (!entity || !Number.isFinite(entity.y)) return;
  entity.setDepth(Math.round(entity.y + groundOffset));
}

/**
 * Load a source-selected sprite sheet at runtime.
 * Frame geometry must be measured from the chosen asset; this helper does not
 * guess frame size, order, animation names or timing.
 */
export function loadSpriteSheetTexture(scene, definition) {
  const { key, url, frameWidth, frameHeight, endFrame } = definition || {};
  if (!scene?.load || !scene?.textures) {
    return Promise.reject(new Error('Sprite-sheet loading requires an active Phaser scene.'));
  }
  if (typeof key !== 'string' || !key.trim()) {
    return Promise.reject(new Error('Sprite-sheet loading requires a non-empty texture key.'));
  }
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return Promise.reject(new Error('Sprite-sheet URL must be an HTTP(S) asset URL.'));
  }
  if (!Number.isInteger(frameWidth) || frameWidth < 1 ||
      !Number.isInteger(frameHeight) || frameHeight < 1) {
    return Promise.reject(new Error('Sprite-sheet frame dimensions must be positive integers.'));
  }
  if (endFrame !== undefined && (!Number.isInteger(endFrame) || endFrame < 0)) {
    return Promise.reject(new Error('Sprite-sheet endFrame must be a non-negative integer.'));
  }
  if (scene.textures.exists(key)) return Promise.resolve(scene.textures.get(key));

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      scene.load.off('complete', onComplete);
      scene.load.off('loaderror', onError);
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const onComplete = () => {
      if (scene.textures.exists(key)) finish(resolve, scene.textures.get(key));
      else finish(reject, new Error('Sprite-sheet load completed without texture: ' + key));
    };
    const onError = file => {
      if (file?.key === key) finish(reject, new Error('Unable to load sprite sheet: ' + url));
    };
    scene.load.once('complete', onComplete);
    scene.load.on('loaderror', onError);
    scene.load.spritesheet(key, url, {
      frameWidth,
      frameHeight,
      ...(endFrame === undefined ? {} : { endFrame })
    });
    scene.load.start();
  });
}

/**
 * Register an animation from an explicitly verified sprite-sheet frame list.
 * Frame order, frame rate and repeat behavior must come from source evidence;
 * this helper intentionally does not infer animation layouts.
 */
export function registerSpriteAnimation(scene, definition) {
  const { key, textureKey, frames, frameRate = 8, repeat = -1 } = definition || {};
  if (!scene?.anims || !scene?.textures) {
    throw new Error('Sprite animation requires an active Phaser scene.');
  }
  if (typeof key !== 'string' || !key.trim()) {
    throw new Error('Sprite animation requires a non-empty key.');
  }
  if (typeof textureKey !== 'string' || !scene.textures.exists(textureKey)) {
    throw new Error('Sprite animation texture is missing: ' + String(textureKey));
  }
  if (!Array.isArray(frames) || !frames.length ||
      frames.some(frame => !Number.isInteger(frame) || frame < 0)) {
    throw new Error('Sprite animation frames must be a non-empty list of non-negative integers.');
  }
  if (!Number.isFinite(frameRate) || frameRate <= 0 || frameRate > 60) {
    throw new Error('Sprite animation frame rate must be greater than 0 and at most 60.');
  }
  if (!Number.isInteger(repeat) || repeat < -1) {
    throw new Error('Sprite animation repeat must be -1 or a non-negative integer.');
  }
  if (scene.anims.exists(key)) {
    throw new Error('Sprite animation key is already registered: ' + key);
  }

  const texture = scene.textures.get(textureKey);
  const missing = [...new Set(frames)].filter(frame => !texture.has(String(frame)));
  if (missing.length) {
    throw new Error('Sprite animation references missing texture frames: ' + missing.join(', '));
  }

  const animation = scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(textureKey, { frames }),
    frameRate,
    repeat
  });
  if (!animation) throw new Error('Unable to register sprite animation: ' + key);
  return animation;
}

/** Play a previously registered animation on a Phaser Sprite. */
export function playSpriteAnimation(entity, key, ignoreIfPlaying = true) {
  if (!entity?.anims || typeof key !== 'string' || !key.trim()) {
    throw new Error('Playing a sprite animation requires an animated entity and a key.');
  }
  if (!entity.anims.animationManager?.exists(key)) {
    throw new Error('Sprite animation is not registered: ' + key);
  }
  entity.play(key, ignoreIfPlaying);
  return entity;
}

export function configureWorldCamera(scene, target, bounds, options = {}) {
  const camera = scene.cameras.main;
  const world = {
    x: Number(bounds?.x ?? 0),
    y: Number(bounds?.y ?? 0),
    width: Number(bounds?.width),
    height: Number(bounds?.height)
  };
  if (![world.x, world.y, world.width, world.height].every(Number.isFinite) ||
      !(world.width > 0 && world.height > 0)) {
    throw new Error('World camera requires finite origin and positive map dimensions.');
  }

  camera.setBounds(world.x, world.y, world.width, world.height);
  camera.setRoundPixels(options.roundPixels !== false);
  if (target) {
    setCameraFollowTarget(camera,target,[
      true,
      Phaser.Math.Clamp(options.lerpX ?? 0.12, 0.01, 1),
      Phaser.Math.Clamp(options.lerpY ?? 0.12, 0.01, 1)
    ]);
    if (options.deadzone) {
      camera.setDeadzone(
        Math.max(1, options.deadzone.width | 0),
        Math.max(1, options.deadzone.height | 0)
      );
    }
  } else {
    // A destroyed server actor must never remain as the camera's hidden target.
    setCameraFollowTarget(camera,null);
  }
  return camera;
}

export function moveWorldEntity(scene, entity, destination, options = {}) {
  if (!scene || !entity || !destination) return null;
  if (!Number.isFinite(destination.x) || !Number.isFinite(destination.y)) {
    throw new Error('World movement destination must contain finite coordinates.');
  }
  const bounds = options.bounds;
  if (bounds && ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) {
    throw new Error('World movement bounds must contain finite values.');
  }
  const x = bounds
    ? Phaser.Math.Clamp(destination.x, bounds.x, bounds.x + Math.max(0, bounds.width))
    : destination.x;
  const y = bounds
    ? Phaser.Math.Clamp(destination.y, bounds.y, bounds.y + Math.max(0, bounds.height))
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
    const collisionIndexes = [...new Set(definition.collisions)];
    if (collisionIndexes.some(index => !Number.isInteger(index) || index < 0)) {
      throw new Error('World collision tile IDs must be non-negative integers.');
    }
    // Phaser.Tilemap.setCollision(indexes, collides, recalculateFaces, layer)
    map.setCollision(collisionIndexes, true, true, layer);
  }
  layer.setDepth(definition.depth || 0);
  return { map, layer };
}
