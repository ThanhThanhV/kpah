export interface WorldMoveIntent { type: "move"; sequence: number; axisX: number; axisY: number; }
export interface WorldAttackIntent { type: "attack"; targetMonsterId: string; }
export interface WorldPlayerSnapshot {
  playerId: string; mapId: string; x: number; y: number; sequence: number;
  hp: number; maxHp: number; dead: boolean;
}
export interface WorldMonsterSnapshot {
  monsterId: string; monsterType: string; mapId: string; spawnRegionId: string;
  x: number; y: number; homeX: number; homeY: number; hp: number; maxHp: number; state: string;
}
export interface WorldSnapshot { type: "snapshot"; players: WorldPlayerSnapshot[]; monsters: WorldMonsterSnapshot[]; }

export class WorldSocketClient {
  private socket?: WebSocket;
  private sequence = 0;
  private localPlayerId?: string;
  private readonly listeners = new Set<(snapshot: WorldSnapshot) => void>();
  private readonly statusListeners = new Set<(connected: boolean) => void>();

  constructor(private readonly url: string) {}

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.addEventListener("open", () => this.statusListeners.forEach((listener) => listener(true)));
    socket.addEventListener("close", () => this.statusListeners.forEach((listener) => listener(false)));
    socket.addEventListener("error", () => this.statusListeners.forEach((listener) => listener(false)));
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as { type?: string; playerId?: string } | WorldSnapshot;
        if (message.type === "welcome" && "playerId" in message) this.localPlayerId = message.playerId;
        else if (message.type === "snapshot" && "players" in message && Array.isArray(message.players)) {
          this.listeners.forEach((listener) => listener({
            ...message, monsters: Array.isArray(message.monsters) ? message.monsters : []
          }));
        }
      } catch { /* Ignore malformed frames; the next valid snapshot restores the view. */ }
    });
  }

  sendMovement(axisX: number, axisY: number): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    const magnitude = Math.hypot(axisX, axisY);
    const scale = magnitude > 1 ? 1 / magnitude : 1;
    const message: WorldMoveIntent = {
      type: "move", sequence: ++this.sequence, axisX: axisX * scale, axisY: axisY * scale
    };
    this.socket.send(JSON.stringify(message));
  }

  sendAttack(targetMonsterId: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN || !targetMonsterId) return;
    const message: WorldAttackIntent = { type: "attack", targetMonsterId };
    this.socket.send(JSON.stringify(message));
  }

  onSnapshot(listener: (snapshot: WorldSnapshot) => void): () => void {
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  }
  onStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener); return () => this.statusListeners.delete(listener);
  }
  getOwnPlayer(snapshot: WorldSnapshot): WorldPlayerSnapshot | undefined {
    return snapshot.players.find((player) => player.playerId === this.localPlayerId);
  }
  destroy(): void {
    this.socket?.close(1000, "scene shutdown");
    this.socket = undefined; this.listeners.clear(); this.statusListeners.clear();
  }
}
