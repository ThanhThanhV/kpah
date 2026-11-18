import Phaser from "phaser";
import type { CharacterAction, DirectionalClip, Facing } from "./CharacterEntity";
import { SpriteSheetCharacterAdapter, type DirectionalClipMap } from "./SpriteSheetCharacterAdapter";

export interface SpriteAnimationDefinition {
  action: CharacterAction;
  facing: Facing;
  start: number;
  end: number;
  frameRate?: number;
  repeat?: number;
}

export interface CharacterSpriteDefinition {
  characterKey: string;
  textureKey: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  animations: SpriteAnimationDefinition[];
}

/** Add entries only when original, project-owned spritesheet art is available. */
export const CHARACTER_SPRITE_CATALOG: CharacterSpriteDefinition[] = [];

export class SpriteSheetAnimationRegistry {
  private readonly clips = new Map<string, DirectionalClipMap>();

  register(scene: Phaser.Scene, definition: CharacterSpriteDefinition): void {
    if (!scene.textures.exists(definition.textureKey)) {
      throw new Error("Spritesheet texture \"" + definition.textureKey + "\" is not loaded.");
    }
    if (this.clips.has(definition.characterKey)) {
      throw new Error("Duplicate character sprite key \"" + definition.characterKey + "\".");
    }
    if (definition.animations.length === 0) {
      throw new Error("Character \"" + definition.characterKey + "\" has no animation clips.");
    }
    const texture = scene.textures.get(definition.textureKey);
    const clips: DirectionalClipMap = {};
    for (const animation of definition.animations) {
      const start = animation.start;
      const end = animation.end;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) {
        throw new Error("Invalid frame range for " + definition.characterKey + ":" + animation.action + ":" + animation.facing + ".");
      }
      if (!texture.has(String(start)) || !texture.has(String(end))) {
        throw new Error("Frame range " + start + "-" + end + " exceeds spritesheet \"" + definition.textureKey + "\".");
      }
      const animationKey = definition.characterKey + ":" + animation.action + ":" + animation.facing;
      if (scene.anims.exists(animationKey)) {
        throw new Error("Duplicate Phaser animation key \"" + animationKey + "\".");
      }
      scene.anims.create({
        key: animationKey,
        frames: scene.anims.generateFrameNumbers(definition.textureKey, { start, end }),
        frameRate: animation.frameRate ?? 8,
        repeat: animation.repeat ?? (animation.action === "idle" || animation.action === "walk" ? -1 : 0)
      });
      const clip: DirectionalClip = {
        source: "spritesheet", animationKey, frameRate: animation.frameRate,
        loop: animation.repeat === undefined
          ? animation.action === "idle" || animation.action === "walk"
          : animation.repeat === -1
      };
      clips[animation.action + ":" + animation.facing] = clip;
    }
    this.clips.set(definition.characterKey, clips);
  }

  createAdapter(
    scene: Phaser.Scene, characterKey: string, x: number, y: number,
    logicalSize: { width: number; height: number }, feetPivot: { x: number; y: number }
  ): SpriteSheetCharacterAdapter | undefined {
    const definition = CHARACTER_SPRITE_CATALOG.find((item) => item.characterKey === characterKey);
    const clips = this.clips.get(characterKey);
    if (!definition || !clips) return undefined;
    return new SpriteSheetCharacterAdapter(scene, definition.textureKey, x, y, logicalSize, feetPivot, clips);
  }
}
