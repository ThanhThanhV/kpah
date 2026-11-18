import Phaser from "phaser";
import { CharacterEntity } from "../game/CharacterEntity";
import { CHARACTER_SPRITE_CATALOG, SpriteSheetAnimationRegistry } from "../game/SpriteSheetAnimationRegistry";
import { MonsterEntity } from "../game/MonsterEntity";
import { LootEntity } from "../game/LootEntity";
import { loadTiledWorldMap } from "../game/TiledMapLoader";
import { MapRenderer } from "../game/MapRenderer";
import { MovementController } from "../game/MovementController";
import { WorldSocketClient, type WorldCombatEvent, type WorldSnapshot } from "../game/WorldSocketClient";

interface RemotePlayerView {
  entity: CharacterEntity; x: number; y: number; targetX: number; targetY: number; lastSeenAt: number;
}

export class GameScene extends Phaser.Scene {
  private player!: CharacterEntity;
  private spriteRegistry!: SpriteSheetAnimationRegistry;
  private mapRenderer!: MapRenderer;
  private movement!: MovementController;
  private worldSocket!: WorldSocketClient;
  private readonly remotePlayers = new Map<string, RemotePlayerView>();
  private readonly monsters = new Map<string, MonsterEntity>();
  private readonly pendingMonsterHits = new Map<string, { event: WorldCombatEvent; expiresAt: number }[]>();
  private readonly pendingPlayerHits = new Map<string, { damage: number; expiresAt: number }[]>();
  private readonly loot = new Map<string, LootEntity>();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerX = 0;
  private playerY = 0;
  private playerDead = false;
  private playerVisualKey = "starter-adventurer";
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
  private unsubscribeQuest?: () => void;
  private interactionKey!: Phaser.Input.Keyboard.Key;
  private questJournalKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private equipWeaponKey!: Phaser.Input.Keyboard.Key;
  private equipBodyKey!: Phaser.Input.Keyboard.Key;
  private unequipWeaponKey!: Phaser.Input.Keyboard.Key;
  private unequipBodyKey!: Phaser.Input.Keyboard.Key;
  private inventoryPanel?: Phaser.GameObjects.Container;
  private inventoryBody?: Phaser.GameObjects.Text;
  private questJournalPanel?: Phaser.GameObjects.Container;
  private questJournalBody?: Phaser.GameObjects.Text;
  private questJournalProgress?: Phaser.GameObjects.Graphics;
  private npcObjects: { id: string; name: string; x: number; y: number; width: number; height: number }[] = [];
  private touchMovement = { x: 0, y: 0 };
  private joystickPointerId = -1;
  private joystickCenter = { x: 0, y: 0 };
  private joystickKnob?: Phaser.GameObjects.Arc;

  constructor() { super("GameScene"); }
  preload(): void {
    this.load.json("starter-meadow", "maps/starter-meadow.json");
    for (const sprite of CHARACTER_SPRITE_CATALOG) {
      this.load.spritesheet(sprite.textureKey, sprite.path, {
        frameWidth: sprite.frameWidth, frameHeight: sprite.frameHeight
      });
    }
  }

  create(): void {
    this.spriteRegistry = new SpriteSheetAnimationRegistry();
    for (const sprite of CHARACTER_SPRITE_CATALOG) this.spriteRegistry.register(this, sprite);
    const map = loadTiledWorldMap(this.cache.json.get("starter-meadow"));
    this.mapRenderer = new MapRenderer(this, map);
    this.npcObjects = map.worldObjects.filter((object) => object.kind === "npc");
    this.playerX = map.spawn.x; this.playerY = map.spawn.y;
    this.movement = new MovementController(this.mapRenderer.worldWidth, this.mapRenderer.worldHeight, this.mapRenderer.collisionRects);
    const playerDefinition = {
      key: "starter-adventurer", displayName: "Wanderer", maxHp: 100,
      feetPivot: { x: 0.5, y: 1 }, logicalSize: { width: 44, height: 64 }
    };
    this.player = new CharacterEntity(
      this, this.playerX, this.playerY, playerDefinition,
      this.spriteRegistry.createAdapter(this, playerDefinition.key, this.playerX, this.playerY,
        playerDefinition.logicalSize, playerDefinition.feetPivot)
    );
    this.cameras.main.setBounds(0, 0, this.mapRenderer.worldWidth, this.mapRenderer.worldHeight);
    this.cameras.main.startFollow(this.player.cameraTarget, true, 0.12, 0.12);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.castKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.secondSkillKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.interactionKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.questJournalKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.equipWeaponKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.equipBodyKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.unequipWeaponKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.unequipBodyKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

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
    this.add.text(18, 132, "WASD / arrows · Space: attack · Shift: Power Strike · Q: Arcane Bolt · E: talk · J: quest · I: bag", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#c0d0c4"
    }).setScrollFactor(0).setDepth(2000);
    this.createQuestJournal();
    this.createInventoryPanel();
    this.createTouchControls();

    const socketUrl = import.meta.env.VITE_WORLD_WS_URL || "ws://localhost:8080/ws/world";
    this.worldSocket = new WorldSocketClient(socketUrl);
    this.unsubscribeStatus = this.worldSocket.onStatus((status) => {
      const labels = {
        connecting: ["World: connecting…", "#f0d18b"],
        connected: ["World: connected", "#9ee0a4"],
        reconnecting: ["World: reconnecting…", "#f0d18b"],
        "authentication-required": ["World: session rejected · returning to account", "#ff9b91"],
        "protocol-error": ["World: protocol error · reload to reconnect", "#ff9b91"]
      } as const;
      const [label, color] = labels[status];
      this.connectionLabel?.setText(label);
      this.connectionLabel?.setColor(color);
      if (status === "authentication-required") {
        window.dispatchEvent(new CustomEvent("kpah:world-auth-required"));
      }
    });
    this.unsubscribeSnapshot = this.worldSocket.onSnapshot((snapshot) => this.applyWorldSnapshot(snapshot));
    this.unsubscribeQuest = this.worldSocket.onQuest((event) => {
      this.combatLabel?.setText(`${event.npcName}: ${event.message}`);
      this.combatLabel?.setColor("#f5dfa0");
    });
    this.unsubscribeCombat = this.worldSocket.onCombat((event) => {
      if (event.targetMonsterId && event.damage !== undefined) {
        this.presentOrQueueMonsterHit(event);
      }
      if (event.targetPlayerId) {
        const ownPlayerId = this.worldSocket.getOwnPlayerId();
        if (event.targetPlayerId === ownPlayerId) {
          this.player.receiveHit(event.damage);
        } else if (event.damage !== undefined && event.damage > 0) {
          const target = this.remotePlayers.get(event.targetPlayerId);
          if (target) target.entity.receiveHit(event.damage);
          else this.queueRemotePlayerHit(event.targetPlayerId, event.damage);
        }
      } else if (event.sourcePlayerId && event.sourcePlayerId !== this.worldSocket.getOwnPlayerId()) {
        const source = this.remotePlayers.get(event.sourcePlayerId);
        if (source) {
          if (event.action === "basic-attack") source.entity.attack();
          else if (event.action === "skill-cast") source.entity.cast();
        }
      }
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
      x: Phaser.Math.Clamp(Number(right) - Number(left) + this.touchMovement.x, -1, 1),
      y: Phaser.Math.Clamp(Number(down) - Number(up) + this.touchMovement.y, -1, 1)
    };
    const movement = this.movement.step({ x: this.playerX, y: this.playerY }, input, delta / 1000);
    this.playerX = movement.position.x; this.playerY = movement.position.y;
    this.player.setMotion(this.playerX, this.playerY, movement.delta.x, movement.delta.y);
    this.networkAccumulator += delta;
    if (this.networkAccumulator >= 50) {
      this.networkAccumulator %= 50; this.worldSocket.sendMovement(input.x, input.y);
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.attackKey)) this.performBasicAttack();
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.castKey)) this.castClassSkill(0);
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.secondSkillKey)) this.castClassSkill(1);
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.interactionKey)) this.interactWithNearestNpc();
    if (Phaser.Input.Keyboard.JustDown(this.questJournalKey)) {
      this.questJournalPanel?.setVisible(!(this.questJournalPanel.visible));
    }
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.inventoryPanel?.setVisible(!(this.inventoryPanel.visible));
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.equipWeaponKey)) {
      this.worldSocket.sendEquip("novice-sword");
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.equipBodyKey)) {
      this.worldSocket.sendEquip("cloth-tunic");
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.unequipWeaponKey)) {
      this.worldSocket.sendUnequip("weapon");
    }
    if (!this.playerDead && Phaser.Input.Keyboard.JustDown(this.unequipBodyKey)) {
      this.worldSocket.sendUnequip("body");
    }
    this.player.update(delta);
    this.updateRemotePlayers(delta);
    this.prunePendingMonsterHits();
    this.prunePendingPlayerHits();
  }



  private createTouchControls(): void {
    if (!this.sys.game.device.input.touch) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.joystickCenter = { x: 88, y: height - 104 };
    this.add.circle(this.joystickCenter.x, this.joystickCenter.y, 56, 0x14262c, 0.55)
      .setStrokeStyle(2, 0xd8e4d0, 0.55).setScrollFactor(0).setDepth(2100);
    this.joystickKnob = this.add.circle(this.joystickCenter.x, this.joystickCenter.y, 23, 0xb9d5c5, 0.72)
      .setStrokeStyle(2, 0xffffff, 0.7).setScrollFactor(0).setDepth(2101);

    const addActionButton = (x: number, y: number, label: string, color: number, action: () => void) => {
      const button = this.add.circle(x, y, 31, color, 0.82)
        .setStrokeStyle(2, 0xe7f0e4, 0.85).setScrollFactor(0).setDepth(2100)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, y, label, {
        fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#ffffff", fontStyle: "bold"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2101);
      button.on("pointerdown", action);
      button.on("pointerover", () => button.setAlpha(1));
      button.on("pointerout", () => button.setAlpha(0.82));
      return { button, text };
    };
    addActionButton(width - 76, height - 100, "ATK", 0x9a5549, () => this.performBasicAttack());
    addActionButton(width - 154, height - 166, "SK1", 0x476c91, () => {
      if (!this.playerDead) this.castClassSkill(0);
    });
    addActionButton(width - 76, height - 238, "SK2", 0x586b8d, () => {
      if (!this.playerDead) this.castClassSkill(1);
    });

    this.input.on("pointerdown", this.handleTouchPointerDown, this);
    this.input.on("pointermove", this.handleTouchPointerMove, this);
    this.input.on("pointerup", this.handleTouchPointerUp, this);
    this.input.on("pointerupoutside", this.handleTouchPointerUp, this);
  }

  private handleTouchPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.joystickPointerId !== -1 || pointer.x > this.scale.width * 0.45
        || pointer.y < this.scale.height * 0.48) return;
    this.joystickPointerId = pointer.id;
    this.updateTouchJoystick(pointer);
  }

  private handleTouchPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointerId) this.updateTouchJoystick(pointer);
  }

  private handleTouchPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointerId) return;
    this.joystickPointerId = -1;
    this.touchMovement = { x: 0, y: 0 };
    this.joystickKnob?.setPosition(this.joystickCenter.x, this.joystickCenter.y);
  }

  private updateTouchJoystick(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.joystickCenter.x;
    const dy = pointer.y - this.joystickCenter.y;
    const distance = Math.hypot(dx, dy);
    const radius = 42;
    const scale = distance > radius ? radius / distance : 1;
    const knobX = dx * scale;
    const knobY = dy * scale;
    this.touchMovement = distance > 7
      ? { x: knobX / radius, y: knobY / radius }
      : { x: 0, y: 0 };
    this.joystickKnob?.setPosition(this.joystickCenter.x + knobX, this.joystickCenter.y + knobY);
  }

  private performBasicAttack(): void {
    if (this.playerDead) return;
    this.player.attack();
    const target = this.findNearestMonster();
    if (target) this.worldSocket.sendAttack(target.monsterId);
  }

  private createInventoryPanel(): void {
    const background = this.add.rectangle(0, 0, 292, 174, 0x14262c, 0.94)
      .setOrigin(0).setStrokeStyle(1, 0x78918a, 0.9);
    const title = this.add.text(12, 9, "INVENTORY & EQUIPMENT · I", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#f5dfa0",
      fontStyle: "bold", letterSpacing: 1
    });
    this.inventoryBody = this.add.text(12, 31, "Waiting for inventory…", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#e6f1dc",
      lineSpacing: 3, wordWrap: { width: 268 }
    });
    this.inventoryPanel = this.add.container(18, this.scale.height - 194, [
      background, title, this.inventoryBody
    ]).setScrollFactor(0).setDepth(2000).setVisible(false);
  }

  private updateInventoryPanel(player: WorldSnapshot["players"][number]): void {
    if (!this.inventoryBody) return;
    const inventory = player.inventory ?? {};
    const catalog = player.itemCatalog ?? {};
    const equipment = player.equipment ?? {};
    const lines = Object.entries(inventory)
      .filter(([, quantity]) => quantity > 0)
      .map(([code, quantity]) => {
        const item = catalog[code];
        return `• ${item?.name ?? code} ×${quantity}`;
      });
    const equipped = ["weapon", "body"].map((slot) => {
      const code = equipment[slot];
      const item = code ? catalog[code] : undefined;
      return `${slot.toUpperCase()}: ${item?.name ?? "Empty"}`;
    });
    const classCode = player.classCode ?? "warrior";
    const classStats = {
      warrior: { hp: 120, attack: 3, defense: 2 },
      mage: { hp: 90, attack: 8, defense: 0 },
      archer: { hp: 100, attack: 5, defense: 1 }
    }[classCode as "warrior" | "mage" | "archer"] ?? { hp: player.maxHp, attack: 0, defense: 0 };
    const bonuses = Object.values(equipment).reduce((total, code) => {
      const item = catalog[code];
      return { attack: total.attack + (item?.attackBonus ?? 0), defense: total.defense + (item?.defenseBonus ?? 0) };
    }, { attack: 0, defense: 0 });
    this.inventoryBody.setText([
      "BAG", ...(lines.length ? lines : ["(empty)"]), "",
      "EQUIPPED", ...equipped,
      `Class: ${classCode.toUpperCase()} · Base HP ${classStats.hp} · ATK +${classStats.attack} · DEF +${classStats.defense}`,
      `Gear: ATK +${bonuses.attack} · DEF +${bonuses.defense}`,
      "1 Equip sword · 2 Equip tunic",
      "3 Unequip weapon · 4 Unequip body"
    ]);
  }

  private createQuestJournal(): void {
    const background = this.add.rectangle(0, 0, 270, 132, 0x14262c, 0.92)
      .setOrigin(0).setStrokeStyle(1, 0x78918a, 0.9);
    const title = this.add.text(12, 9, "QUEST JOURNAL · J", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#f5dfa0",
      fontStyle: "bold", letterSpacing: 1
    });
    this.questJournalBody = this.add.text(12, 32, "Waiting for world state…", {
      fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#e6f1dc",
      lineSpacing: 4, wordWrap: { width: 244 }
    });
    this.questJournalProgress = this.add.graphics();
    this.questJournalPanel = this.add.container(this.scale.width - 288, 18, [
      background, title, this.questJournalBody, this.questJournalProgress
    ]).setScrollFactor(0).setDepth(2000);
  }

  private updateQuestJournal(quest?: WorldSnapshot["players"][number]["quest"]): void {
    if (!this.questJournalBody || !this.questJournalProgress) return;
    const status = quest?.status ?? "available";
    const progress = quest?.progress ?? 0;
    const required = quest?.required ?? 3;
    const npcName = quest?.npcName ?? "Meadow Guide";
    const targetName = quest?.targetDisplayName ?? "Green Slimes";
    const reward = quest?.experienceReward ?? 100;
    const messages: Record<string, string> = {
      available: `Talk to ${npcName} (E) to begin the hunt.`,
      active: `Defeat ${targetName}\nProgress: ${progress}/${required}\nReturn to ${npcName} when complete.`,
      ready: `Objective complete!\nReturn to ${npcName} (E) to claim ${reward} EXP.`,
      claimed: `Quest complete.\nThe meadow is safe. Reward claimed.`
    };
    this.questJournalBody.setText(messages[status] ?? "Quest status unavailable.");
    const ratio = required > 0 ? Phaser.Math.Clamp(progress / required, 0, 1) : 0;
    this.questJournalProgress.clear();
    this.questJournalProgress.fillStyle(0x30443e, 1).fillRoundedRect(12, 112, 246, 7, 3);
    this.questJournalProgress.fillStyle(status === "claimed" ? 0x8bd69a : 0xd8b86c, 1)
      .fillRoundedRect(12, 112, 246 * (status === "claimed" ? 1 : ratio), 7, 3);
  }

  private interactWithNearestNpc(): void {
    let nearest: { id: string; distance: number } | undefined;
    for (const npc of this.npcObjects) {
      const distance = Phaser.Math.Distance.Between(
        this.playerX, this.playerY, npc.x + npc.width / 2, npc.y + npc.height / 2
      );
      if (!nearest || distance < nearest.distance) nearest = { id: npc.id, distance };
    }
    if (!nearest || nearest.distance > 100) {
      this.combatLabel?.setText("No NPC nearby");
      return;
    }
    this.worldSocket.interact(nearest.id);
  }

  private castClassSkill(slot: 0 | 1): void {
    const classCode = this.worldSocket.getCachedClassCode();
    const kits: Record<string, [string, string]> = {
      warrior: ["warrior-power-strike", "warrior-shield-break"],
      mage: ["mage-arcane-bolt", "mage-frost-shard"],
      archer: ["archer-quick-shot", "archer-piercing-arrow"]
    };
    this.castSkill((kits[classCode] ?? kits.warrior)[slot]);
  }

  private castSkill(skillId: string): void {
    const maxRange = skillId === "archer-piercing-arrow" ? 210
      : skillId === "mage-arcane-bolt" ? 180
      : skillId === "archer-quick-shot" || skillId === "mage-frost-shard" ? 165
      : skillId === "warrior-shield-break" ? 90 : 110;
    const target = this.findNearestMonster(maxRange);
    if (!target) {
      this.combatLabel?.setText("No monster in skill range");
      return;
    }
    this.player.cast();
    this.worldSocket.sendSkill(skillId, target.monsterId);
  }

  private findNearestMonster(maxRange = 58): { monsterId: string; distance: number } | undefined {
    let nearest: { monsterId: string; distance: number } | undefined;
    for (const [monsterId, entity] of this.monsters) {
      const distance = Phaser.Math.Distance.Between(this.playerX, this.playerY, entity.worldX, entity.worldY);
      if (!nearest || distance < nearest.distance) nearest = { monsterId, distance };
    }
    return nearest && nearest.distance <= maxRange ? nearest : undefined;
  }

  private applyWorldSnapshot(snapshot: WorldSnapshot): void {
    const ownPlayer = this.worldSocket.getOwnPlayer(snapshot);
    if (ownPlayer) {
      this.ensureLocalCharacterVisual(ownPlayer.classCode ?? "warrior", ownPlayer.name ?? "Adventurer", ownPlayer.maxHp, ownPlayer.hp);
      this.playerX = Phaser.Math.Linear(this.playerX, ownPlayer.x, 0.35);
      this.playerY = Phaser.Math.Linear(this.playerY, ownPlayer.y, 0.35);
      this.playerDead = ownPlayer.hp <= 0;
      this.player.setHp(ownPlayer.hp, ownPlayer.maxHp);
      this.vitalsLabel?.setText(ownPlayer.hp > 0
        ? `HP: ${ownPlayer.hp}/${ownPlayer.maxHp} · MP: ${ownPlayer.mana}/${ownPlayer.maxMana}`
        : "DEFEATED · Respawning…");
      this.vitalsLabel?.setColor(ownPlayer.hp > 0 ? "#ffaaa0" : "#ff6b62");
      const itemCount = Object.values(ownPlayer.inventory ?? {}).reduce((sum, count) => sum + count, 0);
      this.progressionLabel?.setText(
        `Lv ${ownPlayer.level} · EXP ${ownPlayer.experience % 100}/100 · Bag ${itemCount}`
      );
      this.updateQuestJournal(ownPlayer.quest);
      this.updateInventoryPanel(ownPlayer);
    }
    const visibleRemoteIds = new Set<string>();
    const now = this.time.now;
    for (const remote of snapshot.players) {
      if (remote.playerId === ownPlayer?.playerId) continue;
      visibleRemoteIds.add(remote.playerId);
      let view = this.remotePlayers.get(remote.playerId);
      if (!view) {
        const remoteDefinition = {
          key: remote.classCode ?? "remote-player", displayName: remote.name ?? "Adventurer", maxHp: remote.maxHp ?? 100,
          feetPivot: { x: 0.5, y: 1 }, logicalSize: { width: 44, height: 64 }
        };
        const entity = new CharacterEntity(
          this, remote.x, remote.y, remoteDefinition,
          this.spriteRegistry.createAdapter(this, remoteDefinition.key, remote.x, remote.y,
            remoteDefinition.logicalSize, remoteDefinition.feetPivot)
        );
        view = { entity, x: remote.x, y: remote.y, targetX: remote.x, targetY: remote.y, lastSeenAt: now };
        entity.setHp(remote.hp, remote.maxHp);
        this.remotePlayers.set(remote.playerId, view);
        this.flushPendingPlayerHits(remote.playerId);
      } else {
        view.entity.setHp(remote.hp, remote.maxHp);
        const dx = remote.x - view.targetX;
        const dy = remote.y - view.targetY;
        if (Math.hypot(dx, dy) > 0.5) {
          if (Math.abs(dx) > Math.abs(dy)) view.entity.setFacing(dx < 0 ? "left" : "right");
          else view.entity.setFacing(dy < 0 ? "up" : "down");
        }
        view.targetX = remote.x; view.targetY = remote.y; view.lastSeenAt = now;
      }
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
    for (const monsterId of visibleMonsterIds) this.flushPendingMonsterHits(monsterId);
  }

  private queueRemotePlayerHit(playerId: string, damage: number): void {
    const pending = this.pendingPlayerHits.get(playerId) ?? [];
    pending.push({ damage, expiresAt: this.time.now + 1_500 });
    if (pending.length > 8) pending.shift();
    this.pendingPlayerHits.set(playerId, pending);
  }

  private flushPendingPlayerHits(playerId: string): void {
    const pending = this.pendingPlayerHits.get(playerId);
    if (!pending) return;
    this.pendingPlayerHits.delete(playerId);
    const target = this.remotePlayers.get(playerId);
    if (!target) return;
    const now = this.time.now;
    for (const hit of pending) {
      if (hit.expiresAt >= now) target.entity.receiveHit(hit.damage);
    }
  }

  private prunePendingPlayerHits(): void {
    const now = this.time.now;
    for (const [playerId, pending] of this.pendingPlayerHits) {
      const active = pending.filter((hit) => hit.expiresAt >= now);
      if (active.length === 0) this.pendingPlayerHits.delete(playerId);
      else if (active.length !== pending.length) this.pendingPlayerHits.set(playerId, active);
    }
  }

  private presentOrQueueMonsterHit(event: WorldCombatEvent): void {
    const monsterId = event.targetMonsterId;
    if (!monsterId || event.damage === undefined || event.damage <= 0) return;
    const monster = this.monsters.get(monsterId);
    if (monster) {
      monster.showCombatHit(event.damage, event.action === "skill-cast");
      return;
    }
    const pending = this.pendingMonsterHits.get(monsterId) ?? [];
    pending.push({ event, expiresAt: this.time.now + 1_500 });
    if (pending.length > 8) pending.shift();
    this.pendingMonsterHits.set(monsterId, pending);
  }

  private flushPendingMonsterHits(monsterId: string): void {
    const pending = this.pendingMonsterHits.get(monsterId);
    if (!pending) return;
    this.pendingMonsterHits.delete(monsterId);
    const now = this.time.now;
    const monster = this.monsters.get(monsterId);
    if (!monster) return;
    for (const queued of pending) {
      if (queued.expiresAt >= now && queued.event.damage !== undefined) {
        monster.showCombatHit(queued.event.damage, queued.event.action === "skill-cast");
      }
    }
  }

  private prunePendingMonsterHits(): void {
    const now = this.time.now;
    for (const [monsterId, pending] of this.pendingMonsterHits) {
      const active = pending.filter((queued) => queued.expiresAt >= now);
      if (active.length === 0) this.pendingMonsterHits.delete(monsterId);
      else if (active.length !== pending.length) this.pendingMonsterHits.set(monsterId, active);
    }
  }

  private ensureLocalCharacterVisual(classCode: string, displayName: string, maxHp: number, hp: number): void {
    if (this.playerVisualKey === classCode) return;
    const previous = this.player;
    const definition = {
      key: classCode, displayName, maxHp,
      feetPivot: { x: 0.5, y: 1 }, logicalSize: { width: 44, height: 64 }
    };
    this.player = new CharacterEntity(
      this, this.playerX, this.playerY, definition,
      this.spriteRegistry.createAdapter(this, classCode, this.playerX, this.playerY,
        definition.logicalSize, definition.feetPivot)
    );
    this.player.setHp(hp);
    this.playerVisualKey = classCode;
    this.cameras.main.startFollow(this.player.cameraTarget, true, 0.12, 0.12);
    previous.destroy();
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
    this.input.off("pointerdown", this.handleTouchPointerDown, this);
    this.input.off("pointermove", this.handleTouchPointerMove, this);
    this.input.off("pointerup", this.handleTouchPointerUp, this);
    this.input.off("pointerupoutside", this.handleTouchPointerUp, this);
    this.unsubscribeSnapshot?.(); this.unsubscribeStatus?.(); this.unsubscribeCombat?.(); this.unsubscribeQuest?.(); this.worldSocket?.destroy();
    for (const view of this.remotePlayers.values()) view.entity.destroy();
    this.remotePlayers.clear();
    for (const monster of this.monsters.values()) monster.destroy();
    this.monsters.clear();
    this.pendingMonsterHits.clear();
    this.pendingPlayerHits.clear();
    for (const drop of this.loot.values()) drop.destroy();
    this.loot.clear();
    this.player?.destroy(); this.mapRenderer?.destroy();
  }
}
