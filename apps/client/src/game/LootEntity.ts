import Phaser from "phaser";
import type { WorldLootSnapshot } from "./WorldSocketClient";

/** Lightweight original ground-drop marker; inventory icons will replace this placeholder. */
export class LootEntity {
  private readonly glow: Phaser.GameObjects.Arc;
  private readonly gem: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private x: number;
  private y: number;

  constructor(scene: Phaser.Scene, snapshot: WorldLootSnapshot) {
    this.x = snapshot.x;
    this.y = snapshot.y;
    this.glow = scene.add.circle(this.x, this.y - 5, 13, 0xf5d76e, 0.18).setDepth(this.y - 1);
    this.gem = scene.add.rectangle(this.x, this.y - 7, 9, 9, 0x7de0bb)
      .setAngle(45).setStrokeStyle(1, 0xe6fff0).setDepth(this.y);
    this.label = scene.add.text(this.x, this.y - 27, snapshot.itemCode, {
      fontFamily: "Arial, sans-serif", fontSize: "9px", color: "#f6e6a7",
      stroke: "#273326", strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(this.y + 2);
  }

  setTarget(snapshot: WorldLootSnapshot): void {
    this.x = snapshot.x;
    this.y = snapshot.y;
    this.glow.setPosition(this.x, this.y - 5).setDepth(this.y - 1);
    this.gem.setPosition(this.x, this.y - 7).setDepth(this.y);
    this.label.setPosition(this.x, this.y - 27).setDepth(this.y + 2);
  }

  destroy(): void {
    this.glow.destroy();
    this.gem.destroy();
    this.label.destroy();
  }
}
