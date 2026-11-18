export interface WorldMoveIntent { type: "move"; sequence: number; axisX: number; axisY: number; }
export interface WorldAttackIntent { type: "attack"; targetMonsterId: string; }
export interface WorldSkillIntent { type: "cast"; skillId: string; targetMonsterId: string; }
export interface WorldQuestEvent { type: "quest"; npcName: string; message: string; questId: string; status: string; progress: number; required: number; experienceReward: number; }
export interface WorldCombatEvent { type: "combat"; action: string; sourcePlayerId?: string; targetPlayerId?: string; skillId?: string; skillName?: string; targetMonsterId?: string; damage?: number; monsterHp?: number; experienceReward?: number; }
export interface WorldItemDefinition { itemCode: string; name: string; type: string; slot: string; attackBonus: number; defenseBonus: number; maxStack: number; }
export interface WorldPlayerSnapshot {
  playerId: string; name?: string; classCode?: string; mapId: string; x: number; y: number; sequence: number;
  hp: number; maxHp: number; dead: boolean; mana: number; maxMana: number;
  skills?: Record<string, { skillId: string; displayName: string; classCode: string; damage: number; range: number; cooldownMillis: number; manaCost: number; requiredLevel: number }>;
  experience: number; level: number; inventory: Record<string, number>;
  equipment?: Record<string, string>; itemCatalog?: Record<string, WorldItemDefinition>;
  quest?: { questId: string; status: string; progress: number; required: number; npcName?: string; targetDisplayName?: string; experienceReward?: number };
}
export interface WorldMonsterSnapshot {
  monsterId: string; monsterType: string; mapId: string; spawnRegionId: string;
  x: number; y: number; homeX: number; homeY: number; hp: number; maxHp: number; state: string;
}
export interface WorldLootSnapshot {
  dropId: string; itemCode: string; amount: number; mapId: string; x: number; y: number;
}
export interface WorldSnapshot {
  type: "snapshot"; players: WorldPlayerSnapshot[]; monsters: WorldMonsterSnapshot[];
  lootDrops: WorldLootSnapshot[];
}

export class WorldSocketClient {
  private socket?: WebSocket;
  private sequence = 0;
  private localPlayerId?: string;
  private cachedClassCode = "warrior";
  private readonly listeners = new Set<(snapshot: WorldSnapshot) => void>();
  private readonly statusListeners = new Set<(connected: boolean) => void>();
  private readonly combatListeners = new Set<(event: WorldCombatEvent) => void>();
  private readonly questListeners = new Set<(event: WorldQuestEvent) => void>();
  private reconnectTimer?: number;
  private heartbeatTimer?: number;
  private pongTimeoutTimer?: number;
  private reconnectAttempt = 0;
  private destroyed = false;

  constructor(private readonly url: string) {}

  connect(): void {
    if (this.destroyed) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;
    const url = new URL(this.url);
    const characterId = localStorage.getItem("kpah.characterId");
    const token = localStorage.getItem("kpah.sessionToken");
    if (!characterId || !token) return;
    url.searchParams.set("characterId", characterId);
    const socket = new WebSocket(url.toString(), "auth." + token);
    this.socket = socket;
    socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.statusListeners.forEach((listener) => listener(true));
      this.startHeartbeat(socket);
    });
    socket.addEventListener("close", (event) => {
      this.stopHeartbeat();
      if (this.socket === socket) this.socket = undefined;
      this.statusListeners.forEach((listener) => listener(false));
      // Policy violations include expired/invalid sessions and character ownership failures.
      // Reconnecting with the same credentials cannot recover; let the login flow refresh them.
      if (event.code !== 1008) this.scheduleReconnect();
    });
    socket.addEventListener("error", () => {
      this.statusListeners.forEach((listener) => listener(false));
      socket.close();
    });
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as { type?: string; playerId?: string } | WorldSnapshot;
        if (message.type === "pong") {
          if (this.pongTimeoutTimer !== undefined) window.clearTimeout(this.pongTimeoutTimer);
          this.pongTimeoutTimer = undefined;
        } else if (message.type === "welcome" && "playerId" in message) this.localPlayerId = message.playerId;
        else if (message.type === "combat") this.combatListeners.forEach((listener) => listener(message as WorldCombatEvent));
        else if (message.type === "quest") this.questListeners.forEach((listener) => listener(message as WorldQuestEvent));
        else if (message.type === "snapshot" && "players" in message && Array.isArray(message.players)) {
          const ownPlayer = message.players.find((player) => player.playerId === this.localPlayerId);
          if (ownPlayer?.classCode) this.cachedClassCode = ownPlayer.classCode;
          this.listeners.forEach((listener) => listener({
            ...message,
            monsters: Array.isArray(message.monsters) ? message.monsters : [],
            lootDrops: Array.isArray(message.lootDrops) ? message.lootDrops : []
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

  interact(npcId: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN || !npcId) return;
    this.socket.send(JSON.stringify({ type: "interact", npcId }));
  }

  sendEquip(itemCode: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN || !itemCode) return;
    this.socket.send(JSON.stringify({ type: "equip", itemCode }));
  }

  sendUnequip(slot: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN || !slot) return;
    this.socket.send(JSON.stringify({ type: "unequip", slot }));
  }

  sendSkill(skillId: string, targetMonsterId: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN || !skillId || !targetMonsterId) return;
    const message: WorldSkillIntent = { type: "cast", skillId, targetMonsterId };
    this.socket.send(JSON.stringify(message));
  }

  onQuest(listener: (event: WorldQuestEvent) => void): () => void {
    this.questListeners.add(listener); return () => this.questListeners.delete(listener);
  }
  onCombat(listener: (event: WorldCombatEvent) => void): () => void {
    this.combatListeners.add(listener); return () => this.combatListeners.delete(listener);
  }
  onSnapshot(listener: (snapshot: WorldSnapshot) => void): () => void {
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  }
  onStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener); return () => this.statusListeners.delete(listener);
  }
  getCachedClassCode(): string { return this.cachedClassCode; }
  getOwnPlayerId(): string | undefined { return this.localPlayerId; }

  getOwnPlayer(snapshot: WorldSnapshot): WorldPlayerSnapshot | undefined {
    return snapshot.players.find((player) => player.playerId === this.localPlayerId);
  }
  private startHeartbeat(socket: WebSocket): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (socket !== this.socket || socket.readyState !== WebSocket.OPEN) return;
      if (this.pongTimeoutTimer !== undefined) {
        socket.close(4000, "heartbeat timeout");
        return;
      }
      socket.send(JSON.stringify({ type: "ping" }));
      this.pongTimeoutTimer = window.setTimeout(() => {
        this.pongTimeoutTimer = undefined;
        if (socket === this.socket && socket.readyState === WebSocket.OPEN) {
          socket.close(4000, "heartbeat timeout");
        }
      }, 10_000);
    }, 20_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== undefined) window.clearInterval(this.heartbeatTimer);
    if (this.pongTimeoutTimer !== undefined) window.clearTimeout(this.pongTimeoutTimer);
    this.heartbeatTimer = undefined;
    this.pongTimeoutTimer = undefined;
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer !== undefined) return;
    const delay = Math.min(30_000, 1_000 * (2 ** Math.min(this.reconnectAttempt, 5)));
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer !== undefined) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.stopHeartbeat();
    this.socket?.close(1000, "scene shutdown");
    this.socket = undefined;
    this.listeners.clear(); this.statusListeners.clear(); this.combatListeners.clear(); this.questListeners.clear();
  }
}
