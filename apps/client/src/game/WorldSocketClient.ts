export interface WorldMoveIntent {
  type: "move";
  sequence: number;
  axisX: number;
  axisY: number;
}

export interface WorldPlayerSnapshot {
  playerId: string;
  mapId: string;
  x: number;
  y: number;
  sequence: number;
}

export interface WorldSnapshot {
  type: "snapshot";
  players: WorldPlayerSnapshot[];
}

/** Small version-1 websocket transport. Simulation remains authoritative on the server. */
export class WorldSocketClient {
  private socket?: WebSocket;
  private sequence = 0;
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
        const message = JSON.parse(String(event.data)) as WorldSnapshot;
        if (message.type === "snapshot" && Array.isArray(message.players)) {
          this.listeners.forEach((listener) => listener(message));
        }
      } catch {
        // Ignore malformed frames; the next valid snapshot will restore the view.
      }
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

  onSnapshot(listener: (snapshot: WorldSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  destroy(): void {
    this.socket?.close(1000, "scene shutdown");
    this.socket = undefined;
    this.listeners.clear();
    this.statusListeners.clear();
  }
}
