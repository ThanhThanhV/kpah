import type { CollisionRect, WorldMapDefinition, WorldPoint, WorldObject } from "./MapDefinition";
interface TiledProperty { name: string; value: unknown; }
interface TiledTile { id: number; properties?: TiledProperty[]; }
interface TiledTileset { firstgid: number; tiles?: TiledTile[]; }
interface TiledLayer { id: number; name: string; type: string; visible?: boolean; data?: number[]; objects?: TiledObject[]; }
interface TiledObject { id: number; name?: string; type?: string; class?: string; x: number; y: number; width?: number; height?: number; point?: boolean; visible?: boolean; properties?: TiledProperty[]; }
interface TiledJson { type: "map"; orientation: string; infinite: boolean; width: number; height: number; tilewidth: number; tileheight: number; layers: TiledLayer[]; tilesets?: TiledTileset[]; properties?: TiledProperty[]; }
function propertiesOf(properties: TiledProperty[] = []): Map<string, unknown> {
  return new Map(properties.map((property) => [property.name, property.value]));
}
/** Converts finite orthogonal Tiled JSON maps into the runtime-neutral world model. */
export function loadTiledWorldMap(source: unknown): WorldMapDefinition {
  const tiled = source as TiledJson;
  if (!tiled || tiled.type !== "map" || tiled.orientation !== "orthogonal" || tiled.infinite) {
    throw new Error("Only finite orthogonal Tiled JSON maps are supported.");
  }
  if (!Number.isInteger(tiled.width) || tiled.width < 1 || !Number.isInteger(tiled.height) || tiled.height < 1 ||
      !Number.isInteger(tiled.tilewidth) || tiled.tilewidth < 8 || tiled.tilewidth !== tiled.tileheight) {
    throw new Error("Tiled map must have positive dimensions and square tiles.");
  }
  const groundLayer = tiled.layers.find((layer) => layer.type === "tilelayer" && layer.name === "ground");
  if (!groundLayer?.data || groundLayer.data.length !== tiled.width * tiled.height) {
    throw new Error('Tiled map requires a finite tile layer named "ground" with complete data.');
  }
  const tileTerrain = new Map<number, number>();
  for (const tileset of tiled.tilesets ?? []) for (const tile of tileset.tiles ?? []) {
    const terrainId = propertiesOf(tile.properties).get("terrainId");
    if (typeof terrainId === "number" && Number.isInteger(terrainId) && terrainId >= 0 && terrainId <= 2) {
      tileTerrain.set(tileset.firstgid + tile.id, terrainId);
    }
  }
  const ground = groundLayer.data.map((gid) => {
    if (!Number.isInteger(gid) || gid < 0) throw new Error("Tiled ground layer contains an invalid GID.");
    if (gid === 0) return 0;
    return tileTerrain.get(gid) ?? (gid % 3);
  });
  const collisions: CollisionRect[] = [];
  const worldObjects: WorldObject[] = [];
  let spawn: WorldPoint | undefined;
  for (const layer of tiled.layers.filter((entry) => entry.type === "objectgroup" && entry.visible !== false)) {
    for (const object of layer.objects ?? []) {
      if (object.visible === false) continue;
      const props = propertiesOf(object.properties);
      const kind = object.class || object.type || String(props.get("kind") ?? "");
      const { x, y } = object;
      const width = object.width ?? 0;
      const height = object.height ?? 0;
      if (![x, y, width, height].every(Number.isFinite)) throw new Error(`Tiled object ${object.id} has invalid coordinates.`);
      if (kind === "spawn" || props.get("role") === "player-spawn") { spawn = { x, y }; continue; }
      if (kind === "collision" || props.get("solid") === true) {
        if (width <= 0 || height <= 0) throw new Error(`Collision object ${object.id} must be a rectangle.`);
        const collisionKind = props.get("collisionKind");
        collisions.push({ x, y, width, height, kind: collisionKind === "wall" || collisionKind === "water" ? collisionKind : "obstacle" });
        continue;
      }
      if (kind === "npc" || kind === "monster-spawn" || kind === "portal") {
        worldObjects.push({ id: String(object.id), kind, name: object.name || String(props.get("displayName") ?? kind), x, y, width, height });
      }
    }
  }
  const mapProps = propertiesOf(tiled.properties);
  const map: WorldMapDefinition = {
    id: String(mapProps.get("mapId") ?? "untitled-map"),
    name: String(mapProps.get("displayName") ?? "Untitled Map"),
    width: tiled.width, height: tiled.height, tileSize: tiled.tilewidth,
    spawn: spawn ?? { x: tiled.tilewidth, y: tiled.tileheight },
    ground, collisions, worldObjects
  };
  validateLoadedMap(map);
  return map;
}
function validateLoadedMap(map: WorldMapDefinition): void {
  const worldWidth = map.width * map.tileSize;
  const worldHeight = map.height * map.tileSize;
  if (map.spawn.x < 0 || map.spawn.y < 0 || map.spawn.x >= worldWidth || map.spawn.y >= worldHeight) {
    throw new Error(`Player spawn is outside map bounds: ${map.id}.`);
  }
  for (const rect of map.collisions) {
    if (rect.width <= 0 || rect.height <= 0 || rect.x < 0 || rect.y < 0 ||
        rect.x + rect.width > worldWidth || rect.y + rect.height > worldHeight) throw new Error(`Invalid collision rectangle in Tiled map ${map.id}.`);
  }
}
