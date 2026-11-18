import Phaser from "phaser";
import { CharacterEntity } from "../game/CharacterEntity";
import { MonsterEntity } from "../game/MonsterEntity";
import { LootEntity } from "../game/LootEntity";
import { loadTiledWorldMap } from "../game/TiledMapLoader";
import { MapRenderer } from "../game/MapRenderer";
import { MovementController } from "../game/MovementController";
import { WorldSocketClient, type WorldSnapshot } from "../game/WorldSocketClient";

interface RemotePlayerView {
  entity: CharacterEntity; x: number; y: number; targetX: number; targetY: number; lastSeenAt: number;
}

export class GameScene extends Phaser.Scene {
  private player!: CharacterEntity;
  private mapRenderer!: MapRenderer;
  private movement!: MovementController;
  private worldSocket!: WorldSocketClient;
  private readonly remotePlayers = new Map<string, RemotePlayerView>();
  private readonly monsters = new Map<string, MonsterEntity>();
  private readonly loot = new Map<string, LootEntity>();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerX = 0;
  private playerY = 0;
  private playerDead = false;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private castKey!: Phaser.Input.Keyboard.Key;
  private secondSkillKey!: Phaser.Input.Keyboard.Key;
  private networkAccumulator = 0;
  private connectionLabel?: Phaser.GameObjects.Text;
  private vitalsLabel?: Phaser.GameObjects.Text;
  private progressionLabel?: Phaser.GameObjects.Text;
  private combatLabel?: Phaser.GameObjects.Text;
  private unsubscribeSnapshot?: () => void;
  private unsubscribeStatus?: () => void;
  private unsubscribeCombat?: () => void;

  constructor() { super("GameScene"); }
  preload(): void { this.load.json("starter-meadow", "maps/starter-meadow.json"); }

  create(): void {
    const map = loadTiledWorldMap(this.cache.json.get("starter-meadow"));
    this.mapRenderer = new MapRenderer(this, map);
    this.playerX = map.spawn.x; this.playerY = map.spawn.y;
    this.movement = new MovementController(this.mapRenderer.worldWidth, this.mapRenderer.worldHeight, this.mapRenderer.collisionRects);
    this.player = new CharacterEntity(this, this.playerX, this.playerY);
    this.cameras.main.setBounds(0, 0, this.mapRenderer.worldWidth, this.mapRenderer.worldHeight);
    this.cameras.main.startFollow(this.player.cameraTarget, true, 0.12, 0.12);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.castKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.secondSkillKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    this.add.text(18, 18, "P1 · TILED MAP + MULTIPLAYER", {
      fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#e6f1dc",
      backgroundColor: "#14262acc", padding: { x: 10, y: 7 }
    }).setScrollFactor(0).setDepth(2000);
    this.connectionLabel = this.add.text(18, 42, "World: connecting…", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#f0d18b"
    }).setScrollFactor(0).setDepth(2000);
    this.vitalsLabel = this.add.text(18, 60, "HP: -- / 100", {
      fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#ffaaa0",
      backgroundColor: "#14262acc", padding: { x: 7, y: 4 }
    }).setScrollFactor(0).setDepth(2000);
    this.progressionLabel = this.add.text(18, 84, "Lv 1 · EXP 0/100 · Bag 0", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#f5dfa0",
      backgroundColor: "#14262acc", padding: { x: 7, y: 4 }
    }).setScrollFactor(0).setDepth(2000);
    this.combatLabel = this.add.text(18, 108, "Combat: ready", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#b9dcff",
      backgroundColor: "#14262acc", padding: { x: 7, y: 4 }
    }).setScrollFactor(0).setDepth(2000);
    this.add.text(18, 132, "WASD / arrows · Space: attack · Shift: Power Strike · Q: Arcane Bolt", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#c0d0c4"
    }).setScrollFactor(0).setDepth(2000);

    const socketUrl = import.meta.env.VITE_WORLD_WS_URL || "ws://localhost:8080/ws/world";
    this.worldSocket = new WorldSocketClient(socketUrl);
    this.unsubscribeStatus = this.worldSocket.onStatus((connected) => {
      this.connectionLabel?.setText(connected ? "World: connected" : "World: offline (local prediction)");
      this.connectionLabel?.setColor(connected ? "#9ee0a4" : "#f0d18b");
    });
    this.unsubscribeSnapshot = this.worldSocket.onSnapshot((snapshot) => this.applyWorldSnapshot(snapshot));
    this.unsubscribeCombat = this.worldSocket.onCombat((event) => {
      this.combatLabel?.setText(`${event.skillName ?? "Combat"} · ${event.damage ?? 0} damage`);
      this.combatLabel?.setColor("#a9e7ff");
    });
    this.worldSocket.connect();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_time: number, delta: number): void {
    const left = this.cursors.left.isDown || this.keys["A"].isDown;
    const right = this.cursors.right.isDown || this.keys["D"].isDown;
    const up = this.cursors.up.isDown || this.keys["W"].isDown;
    const down = this.cursors.down.isDown || this.keys["S"].isDown;
    const input = this.playerDead ? { x: 0, y: 0 } : {
      x: Number(right) - Number(left), y: Number(down) - Number(up)
    };
    const movement = this.movement.step({ x: this.playerX, y: this.playerY }, input, delta / 1000);
    this.playerX = movement.position.x; this.playerY = movement.position.y;
    this.player.setMotion(this.playerX, this.playerY, movement.delta.x, movement.delta.y);
    this.networkAccumulator += delta;
    if (this.networkAccumulator >= 50) {
      this.networkAccumulator %= 50; this.worldSocket.sendMovement(input.x, input.y);
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.player.attack();
      const target = this.findNearestMonster();
      if (target) this.worldSocket.sendAttack(target.monsterId);
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.castKey)) this.castSkill("power-strike");
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.secondSkillKey)) this.castSkill("arcane-bolt");
    this.player.update(delta);
    this.updateRemotePlayers(delta);
  }

  private castSkill(skillId: string): void {
    const target = this.findNearestMonster();
    if (!target) {
      this.combatLabel?.setText("No monster in skill range");
      return;
    }
    this.player.cast();
    this.worldSocket.sendSkill(skillId, target.monsterId);
  }

  private findNearestMonster(): { monsterId: string; distance: number } | undefined {
    let nearest: { monsterId: string; distance: number } | undefined;
    for (const [monsterId, entity] of this.monsters) {
      const distance = Phaser.Math.Distance.Between(this.playerX, this.playerY, entity.worldX, entity.worldY);
      if (!nearest || distance < nearest.distance) nearest = { monsterId, distance };
    }
    return nearest && nearest.distance <= 58 ? nearest : undefined;
  }

  private applyWorldSnapshot(snapshot: WorldSnapshot): void {
    const ownPlayer = this.worldSocket.getOwnPlayer(snapshot);
    if (ownPlayer) {
      this.playerX = Phaser.Math.Linear(this.playerX, ownPlayer.x, 0.35);
      this.playerY = Phaser.Math.Linear(this.playerY, ownPlayer.y, 0.35);
      this.playerDead = ownPlayer.hp <= 0;
      this.vitalsLabel?.setText(ownPlayer.hp > 0
        ? `HP: ${ownPlayer.hp} / ${ownPlayer.maxHp}`
        : "DEFEATED · Respawning…");
      this.vitalsLabel?.setColor(ownPlayer.hp > 0 ? "#ffaaa0" : "#ff6b62");
      const itemCount = Object.values(ownPlayer.inventory ?? {}).reduce((sum, count) => sum + count, 0);
      this.progressionLabel?.setText(
        `Lv ${ownPlayer.level} · EXP ${ownPlayer.experience % 100}/100 · Bag ${itemCount}`
      );
    }
    const visibleRemoteIds = new Set<string>();
    const now = this.time.now;
    for (const remote of snapshot.players) {
      if (remote.playerId === ownPlayer?.playerId) continue;
      visibleRemoteIds.add(remote.playerId);
      let view = this.remotePlayers.get(remote.playerId);
      if (!view) {
        const entity = new CharacterEntity(this, remote.x, remote.y, {
          key: "remote-player", displayName: "Adventurer", maxHp: 100,
          feetPivot: { x: 0.5, y: 1 }, logicalSize: { width: 44, height: 64 }
        });
        view = { entity, x: remote.x, y: remote.y, targetX: remote.x, targetY: remote.y, lastSeenAt: now };
        this.remotePlayers.set(remote.playerId, view);
      } else { view.targetX = remote.x; view.targetY = remote.y; view.lastSeenAt = now; }
    }
    for (const [playerId, view] of this.remotePlayers) {
      if (!visibleRemoteIds.has(playerId) && now - view.lastSeenAt > 1500) {
        view.entity.destroy(); this.remotePlayers.delete(playerId);
      }
    }

    const visibleLootIds = new Set<string>();
    for (const drop of snapshot.lootDrops ?? []) {
      visibleLootIds.add(drop.dropId);
      const existing = this.loot.get(drop.dropId);
      if (existing) existing.setTarget(drop);
      else this.loot.set(drop.dropId, new LootEntity(this, drop));
    }
    for (const [dropId, entity] of this.loot) {
      if (!visibleLootIds.has(dropId)) { entity.destroy(); this.loot.delete(dropId); }
    }

    const visibleMonsterIds = new Set<string>();
    for (const monster of snapshot.monsters ?? []) {
      visibleMonsterIds.add(monster.monsterId);
      const existing = this.monsters.get(monster.monsterId);
      if (existing) existing.setTarget(monster);
      else this.monsters.set(monster.monsterId, new MonsterEntity(this, monster));
    }
    for (const [monsterId, entity] of this.monsters) {
      if (!visibleMonsterIds.has(monsterId)) { entity.destroy(); this.monsters.delete(monsterId); }
    }
  }

  private updateRemotePlayers(delta: number): void {
    const alpha = 1 - Math.exp(-delta / 90);
    for (const view of this.remotePlayers.values()) {
      const oldX = view.x; const oldY = view.y;
      view.x = Phaser.Math.Linear(view.x, view.targetX, alpha);
      view.y = Phaser.Math.Linear(view.y, view.targetY, alpha);
      view.entity.setMotion(view.x, view.y, view.x - oldX, view.y - oldY);
      view.entity.update(delta);
    }
  }

  private handleShutdown(): void {
    this.unsubscribeSnapshot?.(); this.unsubscribeStatus?.(); this.unsubscribeCombat?.(); this.worldSocket?.destroy();
    for (const view of this.remotePlayers.values()) view.entity.destroy();
    this.remotePlayers.clear();
    for (const monster of this.monsters.values()) monster.destroy();
    this.monsters.clear();
    for (const drop of this.loot.values()) drop.destroy();
    this.loot.clear();
    this.player?.destroy(); this.mapRenderer?.destroy();
  }
}
