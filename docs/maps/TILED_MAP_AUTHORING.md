# Tiled map authoring

The Phaser client loads `apps/client/public/maps/starter-meadow.json` at startup. Edit this file with Tiled (JSON export) or replace it with another finite orthogonal map using the same runtime contract.

## Required map settings

- Orientation: Orthogonal
- Infinite map: disabled
- Square tiles, minimum 8 px
- A finite tile layer named `ground` with exactly `width * height` GIDs
- Map custom properties: `mapId` (string) and `displayName` (string)

The current renderer is still a procedural placeholder: it maps tile terrain IDs 0, 1 and 2 to three debug colors. A tileset tile may define an integer custom property `terrainId` (0–2); otherwise non-zero GIDs use a deterministic fallback.

## World object layer

Add an object layer (the current example uses `world`) for runtime markers:

| Object class / type | Meaning | Required geometry |
|---|---|---|
| `spawn` | Player entry point | Point; x/y in world pixels |
| `collision` | Blocking rectangle | Positive width/height |
| `npc` | NPC marker | Point or rectangle |
| `monster-spawn` | Monster spawn region marker | Rectangle recommended |
| `portal` | Map transition marker | Rectangle recommended |

A collision object can also use boolean custom property `solid=true`. Optional `collisionKind` supports `wall` or `water`; all other values become `obstacle`. NPC/portal/spawn-region objects can use `displayName` to set their debug label.

## Current limitations

- Only finite orthogonal JSON maps and uncompressed tile-layer arrays are supported.
- Isometric/hexagonal maps, infinite chunks, encoded/compressed layer data, polygon/polyline collision, animated tiles and external tileset resolution are not implemented.
- Object markers are visualization only; NPC interaction, portal transitions and monster spawning are not yet connected to gameplay systems.
- The current terrain palette is a debug renderer, not final art or a texture atlas.
