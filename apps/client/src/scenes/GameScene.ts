import Phaser from "phaser";
import { CharacterEntity } from "../game/CharacterEntity";
import { createStarterMap } from "../game/MapDefinition";
import { MapRenderer } from "../game/MapRenderer";

export class GameScene extends Phaser.Scene {
  private player!: CharacterEntity;
  private mapRenderer!: MapRenderer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerX = 0;
  private playerY = 0;
  private readonly speed = 190;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private castKey!: Phaser.Input.Keyboard.Key;

  constructor() { super("GameScene"); }

  create(): void {
    const map = createStarterMap();
    this.mapRenderer = new MapRenderer(this, map);
    this.playerX = map.spawn.x;
    this.playerY = map.spawn.y;
    this.player = new CharacterEntity(this, this.playerX, this.playerY);
    this.cameras.main.setBounds(0, 0, this.mapRenderer.worldWidth, this.mapRenderer.worldHeight);
    this.cameras.main.startFollow(this.player.cameraTarget, true, 0.12, 0.12);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.castKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.add.text(18, 18, "P0 · CHARACTER + MAP ENGINE", {
      fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#e6f1dc",
      backgroundColor: "#14262acc", padding: { x: 10, y: 7 }
    }).setScrollFactor(0).setDepth(2000);
    this.add.text(18, 54, "WASD / arrows · Space: attack · Shift: cast", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#c0d0c4"
    }).setScrollFactor(0).setDepth(2000);
    this.add.text(map.spawn.x, map.spawn.y + 34, map.name, {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#e2d7aa"
    }).setOrigin(0.5).setDepth(1);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
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
    const candidateX = this.playerX + vx * this.speed * dt;
    const candidateY = this.playerY + vy * this.speed * dt;
    const resolvedX = this.resolveAxis(this.playerX, candidateX, this.playerY, true);
    const resolvedY = this.resolveAxis(this.playerY, candidateY, resolvedX, false);
    this.playerX = Phaser.Math.Clamp(resolvedX, 14, this.mapRenderer.worldWidth - 14);
    this.playerY = Phaser.Math.Clamp(resolvedY, 14, this.mapRenderer.worldHeight - 14);
    this.player.setMotion(this.playerX, this.playerY, this.playerX - previousX, this.playerY - previousY);

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this.player.attack();
    if (Phaser.Input.Keyboard.JustDown(this.castKey)) this.player.cast();
    this.player.update(delta);
  }

  private resolveAxis(current: number, candidate: number, otherAxis: number, horizontal: boolean): number {
    const halfWidth = 12;
    const halfHeight = 9;
    for (const obstacle of this.mapRenderer.collisionRects) {
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

  private handleShutdown(): void {
    this.player?.destroy();
    this.mapRenderer?.destroy();
  }
}
