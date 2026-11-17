import Phaser from "phaser";
import { CharacterEntity } from "../game/CharacterEntity";

interface Obstacle { x: number; y: number; width: number; height: number; }

export class GameScene extends Phaser.Scene {
  private player!: CharacterEntity;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerX = 640;
  private playerY = 390;
  private readonly speed = 190;
  private readonly obstacles: Obstacle[] = [
    { x: 430, y: 260, width: 130, height: 34 },
    { x: 720, y: 420, width: 160, height: 38 },
    { x: 270, y: 500, width: 70, height: 90 },
    { x: 980, y: 210, width: 55, height: 120 }
  ];
  private attackKey!: Phaser.Input.Keyboard.Key;

  constructor() { super("GameScene"); }

  create(): void {
    this.drawArena();
    this.player = new CharacterEntity(this, this.playerX, this.playerY);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.add.text(18, 18, "P0 · CHARACTER RENDERER + MOVEMENT SPIKE", {
      fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#e6f1dc",
      backgroundColor: "#14262acc", padding: { x: 10, y: 7 }
    }).setScrollFactor(0).setDepth(2000);
    this.add.text(18, 54, "Move with WASD / arrows · Space to attack · Obstacles are solid", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#c0d0c4"
    }).setScrollFactor(0).setDepth(2000);
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    const left = this.cursors.left.isDown || this.keys["A"].isDown;
    const right = this.cursors.right.isDown || this.keys["D"].isDown;
    const up = this.cursors.up.isDown || this.keys["W"].isDown;
    const down = this.cursors.down.isDown || this.keys["S"].isDown;
    let vx = Number(right) - Number(left);
    let vy = Number(down) - Number(up);
    const magnitude = Math.hypot(vx, vy);
    if (magnitude > 0) { vx /= magnitude; vy /= magnitude; }

    const previousX = this.playerX;
    const previousY = this.playerY;
    const nextX = this.playerX + vx * this.speed * dt;
    const nextY = this.playerY + vy * this.speed * dt;
    // Axis-separated resolution gives wall sliding instead of stopping both axes.
    const resolvedX = this.resolveAxis(this.playerX, nextX, this.playerY, true);
    const resolvedY = this.resolveAxis(this.playerY, nextY, resolvedX, false);
    this.playerX = Phaser.Math.Clamp(resolvedX, 28, 1252);
    this.playerY = Phaser.Math.Clamp(resolvedY, 80, 690);
    this.player.setMotion(this.playerX, this.playerY, this.playerX - previousX, this.playerY - previousY);
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this.player.attack();
    this.player.update(delta);
  }

  private resolveAxis(current: number, candidate: number, otherAxis: number, horizontal: boolean): number {
    const halfWidth = 12;
    const halfHeight = 9;
    for (const obstacle of this.obstacles) {
      const overlapsOther = horizontal
        ? otherAxis + halfHeight > obstacle.y && otherAxis - halfHeight < obstacle.y + obstacle.height
        : otherAxis + halfWidth > obstacle.x && otherAxis - halfWidth < obstacle.x + obstacle.width;
      if (!overlapsOther) continue;
      const overlapsCandidate = horizontal
        ? candidate + halfWidth > obstacle.x && candidate - halfWidth < obstacle.x + obstacle.width
        : candidate + halfHeight > obstacle.y && candidate - halfHeight < obstacle.y + obstacle.height;
      if (overlapsCandidate) {
        if (horizontal) return candidate > current ? obstacle.x - halfWidth : obstacle.x + obstacle.width + halfWidth;
        return candidate > current ? obstacle.y - halfHeight : obstacle.y + obstacle.height + halfHeight;
      }
    }
    return candidate;
  }

  private drawArena(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x294a45, 0x294a45, 0x1b353a, 0x1b353a, 1);
    g.fillRect(0, 0, 1280, 720);
    g.lineStyle(1, 0x9ab5a1, 0.08);
    for (let x = 0; x <= 1280; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 720); g.strokePath(); }
    for (let y = 0; y <= 720; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.strokePath(); }
    for (const o of this.obstacles) {
      g.fillStyle(0x10272a, 0.45).fillRoundedRect(o.x + 5, o.y + 7, o.width, o.height, 6);
      g.fillStyle(0x647b67, 1).fillRoundedRect(o.x, o.y, o.width, o.height, 6);
      g.lineStyle(2, 0x9caf87, 0.75).strokeRoundedRect(o.x, o.y, o.width, o.height, 6);
    }
    g.lineStyle(5, 0x91a58b, 0.8).strokeRect(2, 2, 1276, 716);
    this.add.text(640, 690, "DEBUG WORLD · COLLISION TEST ARENA", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#b9cbb4"
    }).setOrigin(0.5).setDepth(1);
  }
}
