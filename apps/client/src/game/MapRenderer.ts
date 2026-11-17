import Phaser from "phaser";
import type { CollisionRect, WorldMapDefinition } from "./MapDefinition";

const TILE_COLORS: Record<number, number> = {
  0: 0x315b45,
  1: 0x887b58,
  2: 0x294f3d
};

export class MapRenderer {
  private readonly groundGraphics: Phaser.GameObjects.Graphics;
  private readonly collisionGraphics: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene, private readonly map: WorldMapDefinition) {
    this.groundGraphics = scene.add.graphics().setDepth(-10000);
    this.collisionGraphics = scene.add.graphics().setDepth(-100);
    this.drawGround();
    this.drawCollisionHints();
  }

  get collisionRects(): readonly CollisionRect[] {
    return this.map.collisions;
  }

  get worldWidth(): number {
    return this.map.width * this.map.tileSize;
  }

  get worldHeight(): number {
    return this.map.height * this.map.tileSize;
  }

  destroy(): void {
    this.groundGraphics.destroy();
    this.collisionGraphics.destroy();
  }

  private drawGround(): void {
    const g = this.groundGraphics;
    const size = this.map.tileSize;
    for (let y = 0; y < this.map.height; y += 1) {
      for (let x = 0; x < this.map.width; x += 1) {
        const tileId = this.map.ground[y * this.map.width + x];
        g.fillStyle(TILE_COLORS[tileId] ?? TILE_COLORS[0], 1);
        g.fillRect(x * size, y * size, size, size);
        // Subtle tile seams make the prototype grid readable without external art.
        g.lineStyle(1, 0x172f29, 0.12);
        g.strokeRect(x * size, y * size, size, size);
      }
    }
    g.lineStyle(5, 0x9caf87, 0.8);
    g.strokeRect(2, 2, this.worldWidth - 4, this.worldHeight - 4);
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
