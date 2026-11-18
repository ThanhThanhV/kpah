import Phaser from "phaser";
import type {
  CharacterAction, CharacterVisualAdapter, DirectionalClip, Facing
} from "./CharacterEntity";

export type DirectionalClipMap = Partial<Record<string, DirectionalClip>>;

/**
 * Phaser SpriteSheet adapter. The caller owns texture loading and animation registration;
 * this adapter only maps logical character states to registered Phaser animation keys.
 */
export class SpriteSheetCharacterAdapter implements CharacterVisualAdapter {
  readonly cameraTarget: Phaser.GameObjects.Sprite;
  private activeAnimation?: string;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    x: number,
    y: number,
    logicalSize: { width: number; height: number },
    feetPivot: { x: number; y: number },
    private readonly clips: DirectionalClipMap
  ) {
    if (!scene.textures.exists(textureKey)) {
      throw new Error(`Character spritesheet texture "${textureKey}" is not loaded.`);
    }
    this.cameraTarget = scene.add.sprite(x, y, textureKey)
      .setOrigin(feetPivot.x, feetPivot.y)
      .setDisplaySize(logicalSize.width, logicalSize.height);
  }

  play(action: CharacterAction, facing: Facing): void {
    const clip = this.clips[`${action}:${facing}`] ?? this.clips[`${action}:down`];
    if (!clip) return;
    if (!this.cameraTarget.scene.anims.exists(clip.animationKey)) return;
    const looping = clip.loop ?? action === "idle" || action === "walk";
    if (this.activeAnimation === clip.animationKey && looping) return;
    this.activeAnimation = clip.animationKey;
    // Replaying a non-looping action restarts the clip, even when its key is unchanged.
    this.cameraTarget.play(clip.animationKey);
  }

  setPosition(x: number, y: number): void { this.cameraTarget.setPosition(x, y); }
  setDepth(depth: number): void { this.cameraTarget.setDepth(depth); }
  destroy(): void { this.cameraTarget.destroy(); }
}
