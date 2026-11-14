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
miss, element, buff or skill-animation semantics. Opcode 7 now provides a
source-confirmed current/max HP pair for an already-existing entity; it does
not create entities. HP bars are rendered only when both values are available.


## Verified current HP projection

S2C opcode 6/9 target records and opcode 106 multi-target records carry a
post-event target HP value; the world reducer stores it as `entity.currentHp`.
S2C opcode 7 provides both `currentHp` and `maxHp` for an existing entity.
The projection exposes both values, and the local HUD renders a separate
server HP meter only when `maxHp > 0`. Demo HP/MP bars are not repurposed.


## Character HP/MP and level synchronization (S2C opcodes 5/32/33)

Source reference: CFR 0.152 decompile from original-JAR analysis artifact
[CI run 43195783681](https://github.com/ThanhThanhV/kpah/actions/runs/43195783681).
The relevant source blocks are `ka.java:case5` (around lines 643-675),
`ka.java:case32` (around 1788-1811), `ka.java:case33` (around 1813-1817),
`mj.java:b(short)` (around 3661-3674), `mj.java:a(short,cx[])` (around
4716-4737), and `mj.java:a(short,byte,int,int)` (around 4740-4764).
The original character sheet consumer in `xg.java` (around 1285-1290)
labels the corresponding fields as HP and MP current/max.

The original `ka.java:case5` resolves a pre-existing kind-0 player through
`mj.b(short)`, then reads the four resource integers directly into
`z.cG` (current HP), `z.cH` (maximum HP), `z.bC` (current MP) and
`z.bB` (maximum MP). It reads `z.cY` as the level byte. The browser maps
`snapshot.combatState[0..3]` to those four named fields and
`snapshot.stateBytes[0]` to level, only after the same kind-0 entity guard.
This supplies initial HP/MP meters from the player snapshot.

Opcode 32 reads a character ID and signed-byte-counted UTF-key / signed-int
records. The original `mj.a(short,cx[])` resolves a kind-0 player and applies
`hp` to current HP (`cE=cG`), `mp` to current MP (`bC`), `bp` to
`aC`, and `sp` to `aD`. The additional byte and short are read only for
the active local character. The browser follows the same entity guard, updates
current HP/MP without changing their maximum values, and retains BP/SP as
auxiliary resource values.

Opcode 33 reads character ID, level byte, and two signed integers. The original
`mj.a(short,byte,int,int)` resolves an existing kind-0 player, assigns
`cY=level`, `cH=cG=valueA` (maximum and current HP), and
`bB=bC=valueB` (maximum and current MP), then emits the level-up visual.
Missing/non-player IDs are ignored. The browser now maps these fields directly
to `level`, `currentHp`, `maxHp`, `currentMp`, and `maxMp`.

Opcode 7 can subsequently refresh current/max HP for an existing world entity;
combat opcodes 6/9/106 refresh post-event current HP. These updates preserve
maximum MP. The local HUD displays HP and MP values and meters only when their
server values are available; BP/SP remain auxiliary text values. No values are
inferred from unknown fields. This is source-level integration; no live-server
packet capture or visual validation has been performed.

## Existing-entity HP state update (S2C opcode 7)

The `ka.java:case7` trace confirms the packet contains entity ID, template ID,
X/Y, current HP, two state bytes, max HP and an opaque integer. The handler
passes the decoded record to `mj.a(ce)`, which resolves an existing entity and
updates it; it does not create an entity. The browser reducer follows that
guard, updates only `currentHp` and `maxHp`, and retains the remaining fields
under `opcode7State` without changing render coordinates or interpreting the
opaque integer. The local HUD displays the server HP ratio only when current
and maximum HP are both available. Unknown entity IDs are recorded as
unresolved world events and never inserted into the entity map.

## Level-up visual feedback (S2C opcode 33)

The original `mj.a(short,byte,int,int)` handler updates the existing kind-0
player's level and HP/MP, then spawns four `level-up` effects at the actor's
world position (`x`, `y - 30`). For the active local player it also emits the
message “Đạt được level N”. The reducer now records a bounded `level-up`
world event with the resolved character ID, level and source actor coordinates.
The Phaser scene consumes each event sequence once, displays a level popup and
four diagonal sparkle particles; the local actor receives the original
Vietnamese level message. The sparkle is an explicit temporary fallback:
the proprietary `level-up` effect atlas has not yet been identified or bound.
Unresolved/non-kind-0 IDs still do not create entities or trigger visuals.
This is source-mapped integration, not live-server visual validation.

## Player death-state transition (combat events)

CFR tracing confirms the player death transition is not inferred from a HUD-only
HP refresh. In the original mj combat handlers, the target receives
z.a_(damageResultHp), which writes the pending HP field cE; the handler
then sets z.w=3 when current HP cG or pending HP cE is non-positive.
Opcode 106 similarly assigns current/pending HP and sets state 3 for a target
whose resulting HP is non-positive. The browser now watches the authoritative
post-hit HP in opcode 6/9 and opcode 106 combat target records. For a kind-0
player, a transition to HP <= 0 triggers the original part action sequence
(state 3) once and a short “Đã gục” world label; a later positive combat HP
clears the local dead latch. This does not yet implement server respawn or
prove the full animation visually; opcode 7 is a separate cd.a(ce) update
path and is not treated as a combat death signal.

## Player revive synchronization (S2C opcode 60)

CFR source mapping: `ka.case 60` delegates to `mj.f(acu)`. The payload is
`i16 characterId, i32 maxHP, i32 maxMP, i16 cW, i32 currentHP`. The original
handler updates `cH`, `bB`, `cW`, `cG`, and pending `cE`; it does not assign
current MP (`bC`), so the browser preserves the previous current-MP value.
For the local active character, `mj.f` clears `w=3` to `w=0` when current HP is
positive and shows “Đã được hồi sinh.”. For a remote kind-0 actor it restores
HP/max HP/max MP and the revive event clears the browser death latch, resets
part playback to idle, and displays a short “Hồi sinh” world label. Unknown
remote IDs are not inserted into the world entity map. This is mapped from
source but still needs live-server packet and visual validation.


### Revive movement and position continuity

Opcode 60 contains no position coordinates. The browser therefore does not
teleport the revived actor: it keeps the current rendered/server position,
stops any stale pre-death movement target, resets movement frame counters and
returns character-part playback to idle. A subsequent authoritative opcode 4
target is allowed to start movement again. For the local server actor, movement
blocking now uses the server death latch/current server HP rather than the
independent offline-demo HP value, so a positive-HP revive can resume movement
without mutating the local demo character save. Destination marker state is
cleared on local revive. This remains source-mapped behavior awaiting live
server validation.


### Camera and entity identity across despawn / respawn

The Phaser camera adapter now delegates follow ownership to the Phaser-independent
`setCameraFollowTarget` helper. It explicitly calls `stopFollow()` when configured
without a target, preventing a removed server container from remaining as a
hidden camera target. The helper has a Node regression test independent of the
browser-only Phaser runtime. The server projection view registry also records a render
identity composed from entity kind, template ID and resolved factory class.
If a server reuses an entity ID for a different render identity without an
intermediate despawn packet, the old container and its movement/death playback
state are discarded and rebuilt. Ordinary position updates and character-part
marker changes retain the existing view. Live server validation is still
required for map transitions and ID reuse ordering.


### Server map transition (S2C opcode 12)

CFR evidence: `ka.java:case12` reads three signed shorts, an optional signed
byte defaulting to -1, a fourth signed short, a UTF label and an optional
boolean followed by remaining map bytes. It calls
`mj.a(short, short, short, short, String, byte[])` and then assigns the
optional byte to `hf.k`.

The source-backed map handler in `mj.java:4009-4078` clears previous map
objects/effects, keeps only the local player in the world entity collection,
resets its action state, and when both tile coordinates differ from -1 moves
the player to `(tileX * 16 + 8, tileY * 16 + 8)`, adding 32 pixels on either
axis when the resulting tile coordinate is at most 1. The fourth short falls
back to the first short when it is -1 and is used as the map resource selector.
The browser reducer now mirrors these known state changes, preserves global
template/resource catalogs, clears prior-map actors/effects, and stores map
bytes without pretending to decode the proprietary map format. Phaser consumes
the transition once, stops stale movement/destination feedback, syncs the local
actor position, and centers the camera on it. Camera bounds remain unchanged; the map byte format and tile-layer adapter
are decoded, but actual tile rendering remains gated on the deployed PNG/type
assets.


### Original map byte stream structure (CFR `hf.a(int, byte[])`)

The original map parser is source-traced in `hf.java:65-300`. It reads an
unsigned-byte width and height, then a row-major `width * height` tile grid
(with tile byte 254 normalized to 255). Three sentinel-terminated sections
follow: rectangular tile overrides (255 terminator), point tile overrides
(255 terminator), and three-byte decoration records (254 is also normalized
to the 255 terminator). The tail contains a one-byte map mode flag, a counted
portal list (x/y, little-endian portal ID, two bytes), then a counted NPC list
(x/y/id). The browser now extracts these records and retains trailing bytes.
This does not yet identify the image atlas behind `ku.L`, collision meanings,
portal grouping/entrance geometry or decoration asset IDs, so it does not
attempt to draw or invent those semantics.


### Tile atlas selection and collision type table

CFR ku.java:696-735 (ku.l(mapResourceId)) selects three paired resources:
- map resource ID greater than 200: t_thanh.png, t_thanh.type, minimap t_thanh_s.png;
- map resource ID less than 110: t.png, t.type, minimap t_small.png;
- all remaining map IDs: t_hang.png, t_hang.type, minimap t_hang_s.png.

The full tile image is sampled by hf.a(Graphics) / hf.b(Graphics)
as 16×16 regions at source X=0 and source Y=tileId*16, so the original
atlas is a vertical strip. The parallel .type file is copied byte-for-byte
to hf.h; map load initializes each cell collision flags as
hf.g[cell] = hf.h[tileId]. hf.a(x,y) considers bit 0x02 blocked.
The browser now records this exact tileset family/path selection in opcode 12
state and exposes byte-table decoding plus the source collision predicate.
The Phaser adapter createOriginalMapTileLayer builds the visual grid from base
tiles plus source-ordered rectangle/point overrides and applies collision per
cell from the unmodified base grid. Actual rendering still waits for the
matching PNG/type resources to be available from the deployed asset root.


### Phaser tile-layer adapter and collision fidelity

The map renderer adapter now accepts a per-cell collision grid in addition to
the visual tile matrix. The visual matrix applies rectangle overrides first
and point overrides second, skipping tile ID 255 (the source's transparent/
no-override sentinel). Collision is deliberately computed from the original
base tile matrix: CFR hf.java initializes hf.g from the base IDs before
drawing the separate override layer, so collision must not be inferred from
the final overlaid image IDs. Tile ID 255 has no base collision; an invalid
non-sentinel ID outside the .type table raises an explicit range error rather
than inventing a blocked value. Phaser applies collision per tile and
recalculates neighboring faces.


### Conditional live map rendering

When an opcode-12 packet contains a decoded map payload, Phaser now requests
the matching atlas PNG and .type file using the selected mapResourceId family.
The loader builds a 16×16 spritesheet, decodes the type bytes, applies the
source-order visual override grid and original base-grid collision, removes
the previous procedural zone objects, creates the original tile layer, updates
world/camera bounds from map width and height, and centers on the server actor.
This path is guarded by map-transition sequence so a slow old asset response
cannot replace a newer map. If either static asset is absent, the transition
and server actor remain usable and the renderer logs the missing asset instead
of fabricating a replacement.
