import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import "./style.css";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: 1280,
  height: 720,
  backgroundColor: "#203b3d",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: false,
    pixelArt: true
  },
  scene: [GameScene]
});

window.addEventListener("beforeunload", () => game.destroy(true));
