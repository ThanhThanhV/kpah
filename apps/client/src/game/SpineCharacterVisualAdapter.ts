import Phaser from "phaser";
import type { CharacterAction, CharacterVisualAdapter, Facing } from "./CharacterEntity";

/** Minimal bridge implemented by the selected Phaser Spine runtime/plugin wrapper. */
export interface SpineDisplayLike {
  gameObject: Phaser.GameObjects.GameObject;
  setAnimation(trackIndex: number, animationName: string, loop: boolean): unknown;
  setPosition(x: number, y: number): unknown;
  setDepth(depth: number): unknown;
  destroy(): void;
}

/**
 * Spine adapter without binding the game client to one plugin version.
 * The integration layer supplies the runtime display and animation-name map.
 */
export class SpineCharacterVisualAdapter implements CharacterVisualAdapter {
  readonly cameraTarget: Phaser.GameObjects.GameObject;
  private activeAnimation?: string;

  constructor(
    private readonly display: SpineDisplayLike,
    private readonly animations: Partial<Record<string, string>>,
    private readonly trackIndex = 0
  ) {
    this.cameraTarget = display.gameObject;
  }

  play(action: CharacterAction, facing: Facing): void {
    const animation = this.animations[`${action}:${facing}`] ?? this.animations[`${action}:down`];
    if (!animation) return;
    const looping = action === "idle" || action === "walk";
    if (this.activeAnimation === animation && looping) return;
    this.activeAnimation = animation;
    // Re-issue one-shot actions so consecutive attacks can restart the same Spine clip.
    this.display.setAnimation(this.trackIndex, animation, looping);
  }

  setPosition(x: number, y: number): void { this.display.setPosition(x, y); }
  setDepth(depth: number): void { this.display.setDepth(depth); }
  destroy(): void { this.display.destroy(); }
}
