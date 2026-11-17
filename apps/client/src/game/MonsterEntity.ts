import Phaser from "phaser";
import type { WorldMonsterSnapshot } from "./WorldSocketClient";

/** Original placeholder slime renderer; replaceable by the future sprite/Spine adapter. */
export class MonsterEntity {
  private readonly body: Phaser.GameObjects.Ellipse;
  private readonly highlight: Phaser.GameObjects.Ellipse;
  private readonly name: Phaser.GameObjects.Text;
  private readonly hpBack: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private x: number;
  private y: number;

  constructor(private readonly scene: Phaser.Scene, snapshot: WorldMonsterSnapshot) {
    this.x = snapshot.x;
    this.y = snapshot.y;
    this.body = scene.add.ellipse(this.x, this.y - 9, 28, 22, 0x65c86c)
      .setStrokeStyle(2, 0x244f36).setDepth(this.y);
    this.highlight = scene.add.ellipse(this.x - 6, this.y - 15, 7, 4, 0xc7f5a4)
      .setDepth(this.y + 1);
    this.name = scene.add.text(this.x, this.y - 34, this.label(snapshot.monsterType), {
      fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#e8f5d9",
      stroke: "#183321", strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(this.y + 2);
    this.hpBack = scene.add.rectangle(this.x, this.y - 28, 30, 3, 0x172126)
      .setOrigin(0.5, 0.5).setDepth(this.y + 2);
    this.hpFill = scene.add.rectangle(this.x - 15, this.y - 28, 30, 3, 0xe45c58)
      .setOrigin(0, 0.5).setDepth(this.y + 3);
    this.setHp(snapshot.hp, snapshot.maxHp);
  }

  setTarget(snapshot: WorldMonsterSnapshot): void {
    this.x = Phaser.Math.Linear(this.x, snapshot.x, 0.45);
    this.y = Phaser.Math.Linear(this.y, snapshot.y, 0.45);
    this.body.setPosition(this.x, this.y - 9).setDepth(this.y);
    this.highlight.setPosition(this.x - 6, this.y - 15).setDepth(this.y + 1);
    this.name.setPosition(this.x, this.y - 34).setDepth(this.y + 2);
    this.hpBack.setPosition(this.x, this.y - 28).setDepth(this.y + 2);
    this.hpFill.setPosition(this.x - 15, this.y - 28).setDepth(this.y + 3);
    this.setHp(snapshot.hp, snapshot.maxHp);
  }

  destroy(): void {
    this.body.destroy();
    this.highlight.destroy();
    this.name.destroy();
    this.hpBack.destroy();
    this.hpFill.destroy();
  }

  private setHp(hp: number, maxHp: number): void {
    this.hpFill.setDisplaySize(30 * Phaser.Math.Clamp(hp / Math.max(1, maxHp), 0, 1), 3);
  }

  private label(type: string): string {
    return type.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }
}
