import Phaser from "phaser";
import { CharacterEntity } from "../game/CharacterEntity";
import { loadTiledWorldMap } from "../game/TiledMapLoader";
import { MapRenderer } from "../game/MapRenderer";
import { MovementController } from "../game/MovementController";
import { WorldSocketClient, type WorldSnapshot } from "../game/WorldSocketClient";

export class GameScene extends Phaser.Scene {
  private player!: CharacterEntity;
  private mapRenderer!: MapRenderer;
  private movement!: MovementController;
  private worldSocket!: WorldSocketClient;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerX = 0;
  private playerY = 0;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private castKey!: Phaser.Input.Keyboard.Key;
  private networkAccumulator = 0;
  private connectionLabel?: Phaser.GameObjects.Text;
  private unsubscribeSnapshot?: () => void;
  private unsubscribeStatus?: () => void;

  constructor() { super("GameScene"); }

  preload(): void {
    this.load.json("starter-meadow", "maps/starter-meadow.json");
  }

  create(): void {
    const map = loadTiledWorldMap(this.cache.json.get("starter-meadow"));
    this.mapRenderer = new MapRenderer(this, map);
    this.playerX = map.spawn.x;
    this.playerY = map.spawn.y;
    this.movement = new MovementController(
      this.mapRenderer.worldWidth, this.mapRenderer.worldHeight, this.mapRenderer.collisionRects
    );
    this.player = new CharacterEntity(this, this.playerX, this.playerY);
    this.cameras.main.setBounds(0, 0, this.mapRenderer.worldWidth, this.mapRenderer.worldHeight);
    this.cameras.main.startFollow(this.player.cameraTarget, true, 0.12, 0.12);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.castKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.add.text(18, 18, "P1 · TILED MAP + SERVER MOVEMENT", {
      fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#e6f1dc",
      backgroundColor: "#14262acc", padding: { x: 10, y: 7 }
    }).setScrollFactor(0).setDepth(2000);
    this.connectionLabel = this.add.text(18, 42, "World: connecting…", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#f0d18b"
    }).setScrollFactor(0).setDepth(2000);
    this.add.text(18, 62, "WASD / arrows · Space: attack · Shift: cast", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#c0d0c4"
    }).setScrollFactor(0).setDepth(2000);

    const socketUrl = import.meta.env.VITE_WORLD_WS_URL || "ws://localhost:8080/ws/world";
    this.worldSocket = new WorldSocketClient(socketUrl);
    this.unsubscribeStatus = this.worldSocket.onStatus((connected) => {
      this.connectionLabel?.setText(connected ? "World: connected" : "World: offline (local prediction)");
      this.connectionLabel?.setColor(connected ? "#9ee0a4" : "#f0d18b");
    });
    this.unsubscribeSnapshot = this.worldSocket.onSnapshot((snapshot) => this.applyWorldSnapshot(snapshot));
    this.worldSocket.connect();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_time: number, delta: number): void {
    const left = this.cursors.left.isDown || this.keys["A"].isDown;
    const right = this.cursors.right.isDown || this.keys["D"].isDown;
    const up = this.cursors.up.isDown || this.keys["W"].isDown;
    const down = this.cursors.down.isDown || this.keys["S"].isDown;
    const input = { x: Number(right) - Number(left), y: Number(down) - Number(up) };
    const movement = this.movement.step({ x: this.playerX, y: this.playerY }, input, delta / 1000);
    this.playerX = movement.position.x;
    this.playerY = movement.position.y;
    this.player.setMotion(this.playerX, this.playerY, movement.delta.x, movement.delta.y);

    this.networkAccumulator += delta;
    if (this.networkAccumulator >= 50) {
      this.networkAccumulator %= 50;
      this.worldSocket.sendMovement(input.x, input.y);
    }
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this.player.attack();
    if (Phaser.Input.Keyboard.JustDown(this.castKey)) this.player.cast();
    this.player.update(delta);
  }

  private applyWorldSnapshot(snapshot: WorldSnapshot): void {
    const ownPlayer = snapshot.players[0];
    if (!ownPlayer) return;
    // Until authenticated identity is introduced, the gateway returns this socket's
    // player first; remote entities will be rendered in the multiplayer milestone.
    this.playerX = ownPlayer.x;
    this.playerY = ownPlayer.y;
  }

  private handleShutdown(): void {
    this.unsubscribeSnapshot?.();
    this.unsubscribeStatus?.();
    this.worldSocket?.destroy();
    this.player?.destroy();
    this.mapRenderer?.destroy();
  }
}
