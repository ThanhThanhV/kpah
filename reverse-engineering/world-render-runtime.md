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

The diagnostic marker path remains the fallback for unsupported kinds/assets. Kind-0
player actors now have a source-backed original part renderer when opcode 1
part metadata and the matching opcode -51 image resource are available:
- opcode 4's marker byte selects the `hd` part-data index;
- the image resource ID is `partIndex + 12000`, requested with C2S opcode -51;
- opcode 1 part bytes are decoded with the CFR `c(byte[])` layout into atlas
  rectangles, frame compositions and the original 2x13 direction/state selector;
- Phaser composes atlas crops in the original non-zero-group then zero-group
  draw order and plays source idle state 0 / walking state 2 sequences at
  the 40 ms client update cadence; horizontal-left orientation mirrors the
  composition.
- CFR confirms `hd.a(bu, o, byte, byte)` sets action state 3 and resets its
  frame cursor. Original `ka` dispatches S2C opcodes 6/9 into `mj.a/b`, whose
  attacker path invokes that actor action method; opcode 106's multi-target
  handler also invokes the attack method on its source actor. The browser now
  starts the one-shot state-3 sequence for a kind-0 attacker on combat events,
  then returns to idle state 0 after the final action frame.
The renderer preserves the auxiliary per-piece tuple without interpreting its
transform flag because CFR constructs it through a temporary `g` object while
`hd` reads the primary `g.d`. It also loads the original `/shadow.png` asset and
places it at the source `hd.a(Graphics)` offsets (X = +10 when facing right,
X = -10 when mirrored, Y = -10), centered beneath the composed character.

CFR establishes the local identity relation: opcode 3 writes the active character
ID to `mj.t.h`; kind-0 world entities use their entity ID in `j.h`; original
lookups compare those values directly (`mj.b(short)` searches kind 0 by `j.h`,
and rendering excludes the actor whose `j.h == mj.t.h`). The reducer stores
`activeCharacterId` from opcode 3 and the Phaser projection marks the matching
kind-0 entity as `isLocalPlayer`. When that actor appears, the scene hides its The verified opcode-5 snapshot name is projected to the local player label and character-name fields in the HUD; opaque snapshot fields are not treated as level, HP or MP.
offline demo placeholder, follows the server actor with the camera, and routes
pointer/keyboard movement through the original C2S opcode 4 payload (two
big-endian signed shorts: target X and target Y). The scene waits for server
world updates to move the actor; it does not locally teleport the authoritative
sprite. If the actor despawns, the scene falls back to the offline demo actor.
Death states, equipment appearance changes and live-server visual
comparison remain open; the action trigger is source-mapped but still requires
live packet and visual confirmation. Kind-1 generic `cd` movement continues to use the
separately verified movement adapter below.


## Original template catalog binding

The source trace established that entity sprite data is loaded dynamically rather than resolved by a static filename table. S2C opcode 100 populates the template catalog (ku.T / cg) with the template name, frame dimensions, movement step, offsets, resource ID and request type. When a spawned entity references a catalog entry without its image, the original client sends C2S opcode -47; S2C opcode -47 returns the packed resource payload.

The browser client now:
- Reduces opcode 100 into serverWorld.templatesById.
- Requests the exact original asset tuple (request type, resource ID, template ID) once per template when a live entity references it.
- Stores the S2C -47 payload in serverWorld.templateAssetPayloadsById only when its template catalog entry exists.
- Displays template name and frame dimensions in the Phaser diagnostic marker.

## Common original monster sprite rendering

The common cg image response is now decoded in the browser: the indexed ba archive is XOR-decoded with NguyenVanMinh, then the resource named <resourceId>_h is concatenated with data. Recognized PNG bytes are loaded into Phaser as a vertical spritesheet. The original cd renderer uses source X=0 and advances only the Y coordinate, so the adapter crops the first column before registering frames.

For generic cd entities, Phaser selects the exact original idle frame index from cd.c[templateType][direction][animationState], currently with direction 0 and idle animation state 0 because the incoming world reducer does not yet provide a verified facing/frame-state projection. Frame dimensions and frame offsets come from opcode 100 metadata. The original shadow layer is not yet reconstructed.

Special bj resource formats (request types 39/40, 70..88, 90..92 and asset mode 1) remain opaque. Specialized entity classes (hd, v, u, x, w, hj, p, q, t, aj, hy, cf, al, am, ak, bq) still use diagnostic markers until their renderers are traced and ported. No walking/action animation or movement interpolation is claimed.



## Generic cd server movement

For generic kind-1 cd entities whose original L value is non-negative, opcode-4 updates are now treated as target coordinates rather than teleports. Phaser advances them on a 40 ms accumulator using the source template movement step, X-before-Y axis priority, strict Y snap threshold and facing values. The original idle/walk frame selector uses cd.c with the current direction and frame state 0/1.

This remains a partial port: Q() status/effect pauses, random Y jitter for non-type-4 templates, server correction edge cases and action/death animation states are not yet modeled. Kind-0 opcode-5 snapshots are now correctly restricted to the original player actor lookup path; they no longer overwrite monster positions.


## Server combat feedback

S2C opcodes 6 and 9 now update the target entity's current HP from the
source-confirmed post-event HP field and append a monotonic, bounded combat
event history. The Phaser scene consumes each event once and draws the raw
damage integer above the target before fading it upward. A session restart
that resets the event sequence is detected so the new session's first events
are not suppressed.

The damage label is intentionally neutral white. The original handler's other
style/flag bytes remain preserved but are not yet translated into critical-hit,
miss, element, buff or skill-animation semantics. HP bars still need a
verified maximum-HP source for generic monster entities; the opcode 7 entity
snapshot ID assignment remains unresolved in the current bytecode notes.


## Verified current HP projection

S2C opcode 6/9 target records and opcode 106 multi-target records carry a post-event target HP value; the world reducer stores it as `entity.currentHp`. The projection now exposes that current value to the local HUD as a separate server-sourced line. It deliberately does not calculate a percentage or overwrite the demo HP/MP bars: a verified maximum-HP source for kind-0 player actors has not yet been established.
