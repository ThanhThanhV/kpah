import Phaser from "phaser";
import type { WorldMonsterSnapshot } from "./WorldSocketClient";

/** Original placeholder slime renderer; replaceable by the future sprite/Spine adapter. */
export class MonsterEntity {
  private readonly body: Phaser.GameObjects.Ellipse;
  private readonly highlight: Phaser.GameObjects.Ellipse;
  private readonly name: Phaser.GameObjects.Text;
  private readonly hpBack: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly heavyStrikeTelegraph: Phaser.GameObjects.Ellipse;
  private x: number;
  private y: number;
  private readonly bodyWidth: number;
  private readonly bodyHeight: number;
  private readonly bodyOffsetY: number;

  get worldX(): number { return this.x; }
  get worldY(): number { return this.y; }

  constructor(private readonly scene: Phaser.Scene, snapshot: WorldMonsterSnapshot) {
    this.x = snapshot.x; this.y = snapshot.y;
    const isWolf = snapshot.monsterType === "forest-wolf";
    const isSentinel = snapshot.monsterType === "forest-sentinel";
    const isAlpha = snapshot.monsterType === "alpha-wolf";
    this.bodyWidth = isAlpha ? 48 : isSentinel ? 40 : isWolf ? 36 : 28;
    this.bodyHeight = isAlpha ? 34 : isSentinel ? 30 : isWolf ? 24 : 22;
    this.bodyOffsetY = isAlpha ? 13 : isSentinel ? 11 : 9;
    const bodyColor = isAlpha ? 0x713f43 : isSentinel ? 0x71816b : isWolf ? 0x98704a : 0x65c86c;
    const outlineColor = isAlpha ? 0x321c24 : isSentinel ? 0x344638 : isWolf ? 0x493323 : 0x244f36;
    const highlightColor = isAlpha ? 0xf1a18c : isSentinel ? 0xc3d7a3 : isWolf ? 0xe0bd86 : 0xc7f5a4;
    this.body = scene.add.ellipse(this.x, this.y - this.bodyOffsetY, this.bodyWidth, this.bodyHeight, bodyColor)
      .setStrokeStyle(isAlpha ? 3 : 2, outlineColor).setDepth(this.y);
    this.highlight = scene.add.ellipse(this.x - 6, this.y - this.bodyOffsetY - 6, 7, 4, highlightColor).setDepth(this.y + 1);
    this.name = scene.add.text(this.x, this.y - this.bodyOffsetY - this.bodyHeight / 2 - 5, this.label(snapshot.monsterType), {
      fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#e8f5d9",
      stroke: "#183321", strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(this.y + 2);
    const hpY = this.y - this.bodyOffsetY - this.bodyHeight / 2 - 1;
    this.hpBack = scene.add.rectangle(this.x, hpY, this.bodyWidth + 2, 3, 0x172126).setOrigin(0.5, 0.5).setDepth(this.y + 2);
    this.hpFill = scene.add.rectangle(this.x - (this.bodyWidth + 2) / 2, hpY,
      this.bodyWidth + 2, 3, 0xe45c58).setOrigin(0, 0.5).setDepth(this.y + 3);
    this.heavyStrikeTelegraph = scene.add.ellipse(snapshot.attackX ?? 0, snapshot.attackY ?? 0,
      184, 184, 0xff3f36, 0.12)
      .setStrokeStyle(3, 0xff554d, 0.95).setDepth(snapshot.attackY ?? snapshot.y).setVisible(false);
    this.setHp(snapshot.hp, snapshot.maxHp);
    this.updateTelegraph(snapshot);
  }

  setTarget(snapshot: WorldMonsterSnapshot): void {
    this.x = Phaser.Math.Linear(this.x, snapshot.x, 0.45);
    this.y = Phaser.Math.Linear(this.y, snapshot.y, 0.45);
    const bodyY = this.y - this.bodyOffsetY;
    const hpY = this.y - this.bodyOffsetY - this.bodyHeight / 2 - 1;
    this.body.setPosition(this.x, bodyY).setDepth(this.y);
    this.highlight.setPosition(this.x - 6, bodyY - 6).setDepth(this.y + 1);
    this.name.setPosition(this.x, bodyY - this.bodyHeight / 2 - 5).setDepth(this.y + 2);
    this.hpBack.setPosition(this.x, hpY).setDepth(this.y + 2);
    this.hpFill.setPosition(this.x - (this.bodyWidth + 2) / 2, hpY).setDepth(this.y + 3);
    this.setHp(snapshot.hp, snapshot.maxHp);
    this.updateTelegraph(snapshot);
  }

  destroy(): void {
    this.body.destroy(); this.highlight.destroy(); this.name.destroy();
    this.hpBack.destroy(); this.hpFill.destroy(); this.heavyStrikeTelegraph.destroy();
  }

  showCombatHit(amount: number, isSkill: boolean): void {
    if (amount <= 0) return;
    const color = isSkill ? "#9fe7ff" : "#ffffff";
    const label = this.scene.add.text(this.x, this.y - 42, String(amount), {
      fontFamily: "Arial, sans-serif", fontSize: isSkill ? "16px" : "14px",
      fontStyle: "bold", color, stroke: "#172126", strokeThickness: 3
    }).setOrigin(0.5).setDepth(this.y + 10);
    const impactRing = this.scene.add.ellipse(this.x, this.y - this.bodyOffsetY, this.bodyWidth, this.bodyHeight, 0xffffff, 0)
      .setStrokeStyle(2, isSkill ? 0x8bd8ff : 0xffffff, 0.95).setDepth(this.y + 4);
    const skillRing = isSkill
      ? this.scene.add.ellipse(this.x, this.y - this.bodyOffsetY, this.bodyWidth * 0.6, this.bodyHeight * 0.6, 0xffffff, 0)
          .setStrokeStyle(2, 0xd7f6ff, 0.9).setDepth(this.y + 5)
      : undefined;
    this.scene.tweens.add({
      targets: label, y: label.y - 28, alpha: 0, duration: 620,
      ease: "Cubic.Out", onComplete: () => label.destroy()
    });
    this.scene.tweens.add({
      targets: impactRing, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 260,
      ease: "Cubic.Out", onComplete: () => impactRing.destroy()
    });
    if (skillRing) {
      this.scene.tweens.add({
        targets: skillRing, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 340,
        ease: "Cubic.Out", onComplete: () => skillRing.destroy()
      });
    }
    this.scene.tweens.add({
      targets: this.body, alpha: 0.45, duration: 65, yoyo: true, repeat: 1
    });
  }

  private updateTelegraph(snapshot: WorldMonsterSnapshot): void {
    const radius = snapshot.attackRadius ?? 0;
    const active = snapshot.state === "windup" && radius > 0;
    this.heavyStrikeTelegraph.setVisible(active);
    if (active) {
      this.heavyStrikeTelegraph.setPosition(snapshot.attackX ?? snapshot.x, snapshot.attackY ?? snapshot.y)
        .setDisplaySize(radius * 2, radius * 2)
        .setDepth((snapshot.attackY ?? snapshot.y) - 1);
    }
  }

  private setHp(hp: number, maxHp: number): void {
    this.hpFill.setDisplaySize((this.bodyWidth + 2) * Phaser.Math.Clamp(hp / Math.max(1, maxHp), 0, 1), 3);
  }

  private label(type: string): string {
    const labels: Record<string, string> = {
      "green-slime": "Green Slime",
      "forest-wolf": "Forest Wolf",
      "forest-sentinel": "Forest Sentinel",
      "alpha-wolf": "Alpha Wolf"
    };
    return labels[type] ?? type.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }
}
