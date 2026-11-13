# World rendering runtime

## Current implementation

`src/world-runtime.js` centralizes the Phaser world primitives used by the client:

- Camera bounds, follow target, follow interpolation, dead-zone and pixel rounding.
- Entity depth sorting from its ground Y coordinate.
- Movement tweens with optional world-space bounds.
- A tile-layer adapter that accepts a verified rectangular tile-ID matrix and a Phaser spritesheet key, including optional collision indices.

`src/main.js` now routes pointer movement, directional controls and keyboard movement through the shared movement helper. The player label follows the player entity instead of remaining at a fixed screen coordinate. The scene initializes a camera follow rig.

## Evidence boundary

Camera bounds and movement coordinates are checked for finite values; invalid map dimensions or destinations fail explicitly. The Phaser tile collision call uses the documented `(indexes, collides, recalculateFaces, layer)` argument order.

The currently rendered village is still procedural placeholder art. The world bounds are still 960 × 560, so camera-follow infrastructure is in place but does not yet demonstrate scrolling. No original KPAH map matrix, tile-ID mapping, collision data or map-specific tileset has been reconstructed here.

Do not populate the tile adapter with guessed IDs. The next reverse-engineering step is to trace the original `mj` map load/draw path and the map/tile readers, then feed only verified map data into this runtime.

## Inbound server-world diagnostic layer

The browser protocol panel now publishes each reduced protocol state as a
`kpah:protocol-state` event. The Phaser `WorldScene` consumes
`state.serverWorld` and maintains one diagnostic marker per known entity ID.

- `projectServerWorldEntities` uses the source-backed entity order, kind,
  template ID and opcode 4 coordinates; when an opcode 5 snapshot exists, its
  source-backed X/Y coordinates take precedence.
- Kind 0 is displayed as a player-like marker and kind 1 as a marker for the
  original monster/NPC family. Other kinds remain neutral/unknown.
- Opcode 8 removals destroy the corresponding marker. Inactive or coordinate-
  incomplete records are not rendered.
- Labels expose entity ID, kind and template ID to make captures debuggable.

This is a diagnostic binding, not original character rendering: no template ID
is mapped to a sprite, atlas, animation, facing or movement speed. Positions
are shown at the latest received server coordinate; the original `cd`
template-specific interpolation rule is not simulated. The demo-local player
and monsters remain separate from these server markers, and no local-player
identity or combat HP is inferred.
