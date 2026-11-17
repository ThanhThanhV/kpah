import Phaser from "phaser";
import type { CollisionRect, WorldMapDefinition, WorldObject } from "./MapDefinition";

const TILE_COLORS: Record<number, number> = { 0: 0x315b45, 1: 0x887b58, 2: 0x294f3d };

export class MapRenderer {
  private readonly groundGraphics: Phaser.GameObjects.Graphics;
  private readonly collisionGraphics: Phaser.GameObjects.Graphics;
  private readonly objectGraphics: Phaser.GameObjects.Graphics;
  private readonly objectLabels: Phaser.GameObjects.Text[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly map: WorldMapDefinition) {
    this.groundGraphics = scene.add.graphics().setDepth(-10000);
    this.collisionGraphics = scene.add.graphics().setDepth(-100);
    this.objectGraphics = scene.add.graphics().setDepth(2);
    this.drawGround();
    this.drawCollisionHints();
    this.drawWorldObjects();
  }

  get collisionRects(): readonly CollisionRect[] { return this.map.collisions; }
  get worldWidth(): number { return this.map.width * this.map.tileSize; }
  get worldHeight(): number { return this.map.height * this.map.tileSize; }

  destroy(): void {
    this.groundGraphics.destroy();
    this.collisionGraphics.destroy();
    this.objectGraphics.destroy();
    this.objectLabels.forEach((label) => label.destroy());
  }

  private drawWorldObjects(): void {
    const colors: Record<WorldObject["kind"], number> = {
      npc: 0x79c7e8, "monster-spawn": 0xe17c68, portal: 0xb99be8
    };
    for (const object of this.map.worldObjects) {
      const color = colors[object.kind];
      const width = Math.max(object.width, 18);
      const height = Math.max(object.height, 18);
      this.objectGraphics.lineStyle(2, color, 0.9).strokeRect(object.x, object.y, width, height);
      this.objectGraphics.fillStyle(color, 0.14).fillRect(object.x, object.y, width, height);
      const label = this.scene.add.text(object.x + width / 2, object.y - 5, object.name, {
        fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#f2eee3",
        backgroundColor: "#142126cc", padding: { x: 4, y: 2 }
      }).setOrigin(0.5, 1).setDepth(3);
      this.objectLabels.push(label);
    }
  }

  private drawGround(): void {
    const g = this.groundGraphics;
    const size = this.map.tileSize;
    for (let y = 0; y < this.map.height; y += 1) {
      for (let x = 0; x < this.map.width; x += 1) {
        const tileId = this.map.ground[y * this.map.width + x];
        g.fillStyle(TILE_COLORS[tileId] ?? TILE_COLORS[0], 1);
        g.fillRect(x * size, y * size, size, size);
        g.lineStyle(1, 0x172f29, 0.12).strokeRect(x * size, y * size, size, size);
      }
    }
    g.lineStyle(5, 0x9caf87, 0.8).strokeRect(2, 2, this.worldWidth - 4, this.worldHeight - 4);
  }

  private drawCollisionHints(): void {
    const g = this.collisionGraphics;
    for (const rect of this.map.collisions) {
      g.fillStyle(0x172126, 0.34).fillRoundedRect(rect.x + 5, rect.y + 7, rect.width, rect.height, 5);
      g.fillStyle(0x647b67, 1).fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 5);
      g.lineStyle(2, 0x9caf87, 0.75).strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 5);
    }
    g.setDepth(1);
  }
}
