import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import {
  renderAuthScreen, renderCharacterSelection, restoreAuthSession, revokeAuthSession,
  type AuthSession
} from "./auth";
import "./style.css";

const gameRoot = document.querySelector<HTMLElement>("#game-root")!;
const app = document.querySelector<HTMLElement>("#app")!;
const authRoot = document.createElement("div");
authRoot.id = "auth-root";
app.insertBefore(authRoot, gameRoot);
gameRoot.hidden = true;

let game: Phaser.Game | undefined;
const status = document.querySelector<HTMLElement>(".status")!;

function createGame(): void {
  if (game) return;
  game = new Phaser.Game({
    type: Phaser.AUTO, parent: "game-root", width: 1280, height: 720,
    backgroundColor: "#203b3d", pixelArt: true, roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: false, pixelArt: true }, input: { activePointers: 3 }, scene: [GameScene]
  });
}

function setAccountStatus(session: AuthSession): void {
  status.innerHTML = '<i></i><span></span><button id="logout-button" type="button">Sign out</button>';
  status.querySelector("span")!.textContent = session.email;
  status.querySelector<HTMLButtonElement>("#logout-button")!.addEventListener("click", async () => {
    await revokeAuthSession();
    game?.destroy(true);
    game = undefined;
    gameRoot.innerHTML = "";
    showLogin();
  });
}

function startGame(session: AuthSession): void {
  localStorage.setItem("kpah.sessionToken", session.token);
  localStorage.setItem("kpah.characterId", session.characterId);
  authRoot.hidden = true;
  gameRoot.hidden = false;
  setAccountStatus(session);
  createGame();
}

function showCharacterSelection(session: AuthSession): void {
  localStorage.setItem("kpah.sessionToken", session.token);
  localStorage.setItem("kpah.characterId", session.characterId);
  gameRoot.hidden = true;
  authRoot.hidden = false;
  setAccountStatus(session);
  renderCharacterSelection(authRoot, session, startGame);
}

function showLogin(): void {
  gameRoot.hidden = true;
  authRoot.hidden = false;
  status.innerHTML = "<i></i><span>ACCOUNT SIGN IN REQUIRED</span>";
  renderAuthScreen(authRoot, showCharacterSelection);
}

let recoveringWorldSession = false;
window.addEventListener("kpah:world-auth-required", () => {
  if (recoveringWorldSession) return;
  recoveringWorldSession = true;
  game?.destroy(true);
  game = undefined;
  gameRoot.innerHTML = "";
  void restoreAuthSession().then((session) => {
    if (session) showCharacterSelection(session);
    else showLogin();
  }).catch(() => showLogin()).finally(() => {
    recoveringWorldSession = false;
  });
});

window.addEventListener("beforeunload", () => game?.destroy(true));
restoreAuthSession().then((session) => {
  if (session) showCharacterSelection(session);
  else showLogin();
}).catch(() => showLogin());
