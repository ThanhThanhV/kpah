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

export interface CharacterVisualAdapter {
  readonly cameraTarget: Phaser.GameObjects.GameObject;
  play(action: CharacterAction, facing: Facing): void;
  setPosition(x: number, y: number): void;
  setDepth(depth: number): void;
  destroy(): void;
}

const ACTION_DURATION: Partial<Record<CharacterAction, number>> = {
  attack: 300,
  cast: 520,
  hit: 190
};

const DEFAULT_DEFINITION: CharacterDefinition = {
  key: "starter-adventurer",
  displayName: "Wanderer",
  maxHp: 100,
  feetPivot: { x: 0.5, y: 1 },
  logicalSize: { width: 44, height: 64 }
};

export class CharacterEntity {
  readonly definition: CharacterDefinition;
  private readonly graphics?: Phaser.GameObjects.Graphics;
  private readonly visualAdapter?: CharacterVisualAdapter;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly hpBack: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private facing: Facing = "down";
  private action: CharacterAction = "idle";
  private moving = false;
  private elapsed = 0;
  private hp: number;

  get cameraTarget(): Phaser.GameObjects.GameObject {
    return this.visualAdapter?.cameraTarget ?? this.graphics!;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, definition = DEFAULT_DEFINITION,
              visualAdapter?: CharacterVisualAdapter) {
    this.definition = definition;
    this.hp = definition.maxHp;
    this.visualAdapter = visualAdapter;
    this.graphics = visualAdapter ? undefined : scene.add.graphics();
    this.nameText = scene.add.text(0, 0, definition.displayName, {
      fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#f4f7e8",
      stroke: "#15252a", strokeThickness: 3
    }).setOrigin(0.5, 1);
    this.hpBack = scene.add.rectangle(0, 0, 42, 4, 0x172126).setOrigin(0.5, 0.5);
    this.hpFill = scene.add.rectangle(-20, 0, 40, 2, 0x71d68b).setOrigin(0, 0.5);
    this.setPosition(x, y);
    this.visualAdapter?.play(this.action, this.facing);
    this.draw();
  }

  setMotion(x: number, y: number, vx: number, vy: number): void {
    this.setPosition(x, y);
    this.moving = Math.hypot(vx, vy) > 0.001;
    if (this.moving) {
      const ax = Math.abs(vx);
      const ay = Math.abs(vy);
      if (ax > ay) this.facing = vx < 0 ? "left" : "right";
      else if (ay > ax) this.facing = vy < 0 ? "up" : "down";
      // Exact diagonal ties keep the previous cardinal facing.
    }
    if (this.action === "idle" || this.action === "walk") {
      this.action = this.moving ? "walk" : "idle";
      this.visualAdapter?.play(this.action, this.facing);
    }
  }

  setFacing(facing: Facing): void {
    this.facing = facing;
    this.visualAdapter?.play(this.action, this.facing);
    this.draw();
  }

  setAction(action: CharacterAction): void {
    if (this.action === "death" && action !== "death") return;
    this.action = action;
    this.elapsed = 0;
    this.visualAdapter?.play(this.action, this.facing);
    this.draw();
  }

  attack(): void { this.setAction("attack"); }
  cast(): void { this.setAction("cast"); }
  receiveHit(): void { this.setAction("hit"); }

  setHp(value: number): void {
    const wasDead = this.hp <= 0;
    this.hp = Phaser.Math.Clamp(value, 0, this.definition.maxHp);
    this.hpFill.width = 40 * (this.hp / this.definition.maxHp);
    if (this.hp === 0) this.setAction("death");
    else if (wasDead && this.action === "death") this.setAction(this.moving ? "walk" : "idle");
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs;
    const duration = ACTION_DURATION[this.action];
    if (duration !== undefined && this.elapsed >= duration) {
      this.action = this.moving ? "walk" : "idle";
      this.elapsed = 0;
      this.visualAdapter?.play(this.action, this.facing);
    }
    this.draw();
  }

  private setPosition(x: number, y: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    this.graphics?.setPosition(px, py);
    this.visualAdapter?.setPosition(px, py);
    this.nameText.setPosition(px, py - 75);
    this.hpBack.setPosition(px, py - 68);
    this.hpFill.setPosition(px - 20, py - 68);
    this.graphics?.setDepth(py);
    this.visualAdapter?.setDepth(py);
    this.nameText.setDepth(py + 2);
    this.hpBack.setDepth(py + 2);
    this.hpFill.setDepth(py + 3);
  }

  private draw(): void {
    if (this.visualAdapter) return;
    const g = this.graphics;
    if (!g) return;
    g.clear();
    const walkPhase = this.action === "walk" ? Math.sin(this.elapsed / 75) * 4 : 0;
    const hitTint = this.action === "hit" ? 0xff7777 : this.action === "death" ? 0x777777 : 0xe9bd78;
    const castGlow = this.action === "cast";
    const deathScale = this.action === "death" ? 0.72 : 1;

    g.fillStyle(0x0a1518, 0.35).fillEllipse(0, -2, 34 * deathScale, 10);
    if (castGlow) {
      g.fillStyle(0x8bd8ff, 0.2).fillCircle(0, -31, 32 + Math.sin(this.elapsed / 55) * 4);
      g.lineStyle(2, 0x8bd8ff, 0.8).strokeCircle(0, -31, 26 + Math.sin(this.elapsed / 55) * 4);
    }

    g.fillStyle(0x263b51, 1);
    g.fillRoundedRect(-10 - walkPhase / 2, -19, 8, 17, 2);
    g.fillRoundedRect(2 + walkPhase / 2, -19, 8, 17, 2);
    g.fillStyle(0x9c7048, 1);
    g.fillRoundedRect(-11 - walkPhase / 2, -5, 10, 5, 2);
    g.fillRoundedRect(1 + walkPhase / 2, -5, 10, 5, 2);

    g.fillStyle(hitTint, 1).fillRoundedRect(-13, -43, 26, 28, 7);
    g.fillStyle(0x385b69, 1).fillRoundedRect(-16, -42, 32, 9, 4);
    g.fillStyle(0xe6bd91, 1).fillCircle(0, -53, 10);
    g.fillStyle(0x493b35, 1).fillEllipse(0, -60, 19, 8);

    const vectors: Record<Facing, { x: number; y: number }> = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    const direction = vectors[this.facing];
    g.fillStyle(0xf3e6b8, 1).fillCircle(direction.x * 5, -53 + direction.y * 4, 1.6);

    if (this.action === "attack") {
      g.lineStyle(3, 0xf4e0a0, 0.95);
      g.beginPath();
      g.arc(direction.x * 27, -35 + direction.y * 5, 17, -0.8, 0.8, false);
      g.strokePath();
    } else if (this.action === "hit") {
      g.lineStyle(2, 0xff7777, 0.9).strokeCircle(0, -34, 24);
    } else if (this.action === "death") {
      g.lineStyle(2, 0x333333, 0.7).strokeEllipse(0, -13, 26, 12);
    }
  }

  destroy(): void {
    this.graphics?.destroy();
    this.visualAdapter?.destroy();
    this.nameText.destroy();
    this.hpBack.destroy();
    this.hpFill.destroy();
  }
}
