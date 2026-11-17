import Phaser from "phaser";

export type Facing = "up" | "down" | "left" | "right";
export type CharacterAction = "idle" | "walk" | "attack" | "cast" | "hit" | "death";

export interface CharacterDefinition {
  key: string;
  displayName: string;
  maxHp: number;
  feetPivot: { x: number; y: number };
  logicalSize: { width: number; height: number };
}

export interface DirectionalClip {
  source: "spritesheet" | "spine";
  animationKey: string;
  frameRate?: number;
  loop?: boolean;
}

/**
 * Renderer-facing contract. Concrete SpriteSheet/Spine adapters can be plugged
 * in later without changing movement, combat or entity identity.
 */
export interface CharacterVisualAdapter {
  play(action: CharacterAction, facing: Facing): void;
  setPosition(x: number, y: number): void;
  setDepth(depth: number): void;
  destroy(): void;
}

const DEFAULT_DEFINITION: CharacterDefinition = {
  key: "starter-adventurer",
  displayName: "Wanderer",
  maxHp: 100,
  feetPivot: { x: 0.5, y: 1 },
  logicalSize: { width: 44, height: 64 }
};

export class CharacterEntity {
  readonly definition: CharacterDefinition;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly hpBack: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private facing: Facing = "down";
  private action: CharacterAction = "idle";
  private moving = false;
  private elapsed = 0;
  private hp: number;

  constructor(private readonly scene: Phaser.Scene, x: number, y: number, definition = DEFAULT_DEFINITION) {
    this.definition = definition;
    this.hp = definition.maxHp;
    this.graphics = scene.add.graphics();
    this.nameText = scene.add.text(0, 0, definition.displayName, {
      fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#f4f7e8",
      stroke: "#15252a", strokeThickness: 3
    }).setOrigin(0.5, 1);
    this.hpBack = scene.add.rectangle(0, 0, 42, 4, 0x172126).setOrigin(0.5, 0.5);
    this.hpFill = scene.add.rectangle(-20, 0, 40, 2, 0x71d68b).setOrigin(0, 0.5);
    this.setPosition(x, y);
    this.draw();
  }

  setMotion(x: number, y: number, vx: number, vy: number): void {
    this.setPosition(x, y);
    const isMoving = Math.hypot(vx, vy) > 0.001;
    this.moving = isMoving;
    if (isMoving) {
      const ax = Math.abs(vx);
      const ay = Math.abs(vy);
      if (ax > ay) this.facing = vx < 0 ? "left" : "right";
      else if (ay > ax) this.facing = vy < 0 ? "up" : "down";
      // Exact diagonal tie intentionally retains last facing.
      if (this.action !== "attack" && this.action !== "cast" && this.action !== "hit") {
        this.action = "walk";
      }
    } else if (this.action === "walk") {
      this.action = "idle";
    }
  }

  setAction(action: CharacterAction): void {
    this.action = action;
    this.draw();
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs;
    if (this.action === "attack" && this.elapsed > 260) this.action = this.moving ? "walk" : "idle";
    if (this.action === "hit" && this.elapsed > 180) this.action = this.moving ? "walk" : "idle";
    this.draw();
  }

  attack(): void {
    this.elapsed = 0;
    this.action = "attack";
    this.draw();
  }

  setHp(value: number): void {
    this.hp = Phaser.Math.Clamp(value, 0, this.definition.maxHp);
    this.hpFill.width = 40 * (this.hp / this.definition.maxHp);
  }

  private setPosition(x: number, y: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    this.graphics.setPosition(px, py);
    this.nameText.setPosition(px, py - 75);
    this.hpBack.setPosition(px, py - 68);
    this.hpFill.setPosition(px - 20, py - 68);
    this.graphics.setDepth(py);
    this.nameText.setDepth(py + 2);
    this.hpBack.setDepth(py + 2);
    this.hpFill.setDepth(py + 3);
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();
    const walkPhase = this.action === "walk" ? Math.sin(this.elapsed / 75) * 4 : 0;
    const attackOffset = this.action === "attack" ? 10 : 0;
    const hitTint = this.action === "hit" ? 0xff7777 : 0xe9bd78;
    // Ground shadow; feet are the world pivot.
    g.fillStyle(0x0a1518, 0.35).fillEllipse(0, -2, 34, 10);
    // Legs and boots.
    g.fillStyle(0x263b51, 1);
    g.fillRoundedRect(-10 - walkPhase / 2, -19, 8, 17, 2);
    g.fillRoundedRect(2 + walkPhase / 2, -19, 8, 17, 2);
    g.fillStyle(0x9c7048, 1);
    g.fillRoundedRect(-11 - walkPhase / 2, -5, 10, 5, 2);
    g.fillRoundedRect(1 + walkPhase / 2, -5, 10, 5, 2);
    // Body, shoulders and head.
    g.fillStyle(hitTint, 1).fillRoundedRect(-13, -43, 26, 28, 7);
    g.fillStyle(0x385b69, 1).fillRoundedRect(-16, -42, 32, 9, 4);
    g.fillStyle(0xe6bd91, 1).fillCircle(0, -53, 10);
    g.fillStyle(0x493b35, 1).fillEllipse(0, -60, 19, 8);
    // Direction indicator and action cue.
    const vectors: Record<Facing, { x: number; y: number }> = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    const direction = vectors[this.facing];
    g.fillStyle(0xf3e6b8, 1).fillCircle(direction.x * 5, -53 + direction.y * 4, 1.6);
    if (this.action === "attack") {
      g.lineStyle(3, 0xf4e0a0, 0.95);
      g.beginPath();
      g.arc(direction.x * 17 + attackOffset * direction.x, -35 + direction.y * 5, 17, -0.8, 0.8, false);
      g.strokePath();
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.nameText.destroy();
    this.hpBack.destroy();
    this.hpFill.destroy();
  }
}
