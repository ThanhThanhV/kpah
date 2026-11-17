export interface WorldPoint {
  x: number;
  y: number;
}

export interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "wall" | "obstacle" | "water";
}

export interface WorldMapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  spawn: WorldPoint;
  /** Row-major tile IDs. 0 = grass, 1 = path, 2 = darker grass. */
  ground: number[];
  collisions: CollisionRect[];
}

export function validateWorldMap(map: WorldMapDefinition): void {
  if (!map.id || !map.name) throw new Error("Map id and name are required.");
  if (!Number.isInteger(map.width) || map.width < 1) throw new Error("Map width must be a positive integer.");
  if (!Number.isInteger(map.height) || map.height < 1) throw new Error("Map height must be a positive integer.");
  if (!Number.isInteger(map.tileSize) || map.tileSize < 8) throw new Error("Map tileSize must be an integer >= 8.");
  if (map.ground.length !== map.width * map.height) {
    throw new Error(`Ground layer length mismatch: expected ${map.width * map.height}, received ${map.ground.length}.`);
  }
  if (map.ground.some((tileId) => !Number.isInteger(tileId) || tileId < 0 || tileId > 2)) {
    throw new Error("Ground layer contains an unsupported tile ID.");
  }
  const worldWidth = map.width * map.tileSize;
  const worldHeight = map.height * map.tileSize;
  if (map.spawn.x < 0 || map.spawn.y < 0 || map.spawn.x >= worldWidth || map.spawn.y >= worldHeight) {
    throw new Error("Player spawn is outside map bounds.");
  }
  for (const rect of map.collisions) {
    if (rect.width <= 0 || rect.height <= 0 || rect.x < 0 || rect.y < 0 ||
        rect.x + rect.width > worldWidth || rect.y + rect.height > worldHeight) {
      throw new Error(`Invalid collision rectangle in map ${map.id}.`);
    }
  }
}

/** Deterministic original placeholder map. Replace tile IDs/art without changing the map contract. */
export function createStarterMap(): WorldMapDefinition {
  const width = 40;
  const height = 22;
  const ground = Array.from({ length: width * height }, (_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    if (x >= 16 && x <= 23 && y >= 8 && y <= 13) return 1;
    return ((x * 17 + y * 31) % 11 === 0) ? 2 : 0;
  });

  const map: WorldMapDefinition = {
    id: "starter-meadow",
    name: "Starter Meadow",
    width,
    height,
    tileSize: 32,
    spawn: { x: 20 * 32, y: 12 * 32 },
    ground,
    collisions: [
      { x: 8 * 32, y: 6 * 32, width: 4 * 32, height: 32, kind: "obstacle" },
      { x: 27 * 32, y: 12 * 32, width: 5 * 32, height: 32, kind: "obstacle" },
      { x: 5 * 32, y: 15 * 32, width: 2 * 32, height: 3 * 32, kind: "obstacle" },
      { x: 34 * 32, y: 5 * 32, width: 32, height: 4 * 32, kind: "obstacle" }
    ]
  };
  validateWorldMap(map);
  return map;
}
