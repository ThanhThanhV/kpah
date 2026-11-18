# WBS progress report

Last updated: 2026-11-18  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

## Current summary
| Measure | Status |
|---|---|
| Repository reset | DONE |
| Project foundation | IN PROGRESS |
| P0 vertical slice | IN PROGRESS |
| Character Renderer | IN PROGRESS |
| Map Engine / Movement | IN PROGRESS |
| Multiplayer transport and client replication | IN PROGRESS |
| Monster system and aggro AI | IN PROGRESS |
| Basic combat, loot and progression | IN PROGRESS |
| Skills / Quests / persistent economy | IN PROGRESS |
| QA / Operations | IN PROGRESS |

## WBS activity tracking
| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 3.1–3.4 | Client/server foundation, world transport and CI | IN PROGRESS | Phaser, Spring Boot, MySQL Compose, JPA persistence and GitHub Actions. |
| 4.1–4.5 | Character renderer and animation | IN PROGRESS | CharacterEntity now supports interchangeable concrete Phaser SpriteSheet and Spine display adapters with procedural fallback; original sprite/Spine assets and runtime-specific animation registration remain. |
| 5 | Map Engine | IN PROGRESS | Two Tiled maps (Starter Meadow, Forest Edge), per-map collision and monster spawns, validated bidirectional portal metadata, server-authoritative portal movement, client map/camera/collision swap; additional maps, map art and playtest validation remain. |
| 6.1–6.3 | Input, movement and facing | IN PROGRESS | Keyboard + mobile virtual joystick, touch attack and two class-skill buttons; client prediction and server-authoritative movement remain. Replicated facing and responsive HUD layout remain. |
| 7.1–7.3 | Monster definitions, AI and presentation | IN PROGRESS | Tiled spawn definitions, bounded roam, aggro, leash, attack cooldown, A* pursuit and snapshot-driven placeholder visuals. |
| 8.1–8.3 | Combat, damage, death and respawn | IN PROGRESS | Server validates basic/skill attacks; class and equipment ATK bonuses affect damage, class/equipment DEF mitigates monster hits (minimum 1), class-specific HP controls health and respawn. |
| 9 | Skills and visual effects | IN PROGRESS | Six class-bound skills with second skill unlocked at level 3, server-authoritative range/damage/cooldown/mana cost, class mana regeneration and MySQL-persisted mana; area targeting and authored VFX remain. |
| 10 | Multiplayer replication | IN PROGRESS | Player, monster, HP, EXP, inventory, loot and quest snapshots; account session is required at WebSocket connect; heartbeat, reconnect and interest management remain. |
| 11 | Character progression | IN PROGRESS | Level every 100 EXP; Warrior gains +12 HP/+2 ATK/+1 DEF per level, Mage +7 HP/+3 ATK, Archer +9 HP/+2 ATK/+1 DEF; mana capacity also grows by class. Second class skill unlocks at level 3; further skill progression and unlock milestones remain. |
| 12 | Loot, item catalog and equipment | IN PROGRESS | Catalog-driven green-slime drop table, 99-stack material limit, 1-stack equipment limit, 20-slot inventory, partial pickup with overflow left on ground, persistent inventory/equipment and HUD. |
| 13.1 | NPC interaction | IN PROGRESS | NPC name and opening dialogue are loaded from Tiled object metadata; server validates NPC identity and 100px interaction range. |
| 14.1 | Quest lifecycle | IN PROGRESS | QuestCatalog defines NPC binding, target monster, required kills, dialogue and reward; progress persists and both basic/skill kills advance matching objectives. |
| 14.2 | Quest Journal UI | IN PROGRESS | Client journal displays objective, kill progress, ready-to-claim and claimed states; toggle with J. |
| 15–17 | Economy, QA and operations | IN PROGRESS | Account register/login/logout, PBKDF2 password hashes, opaque 30-day sessions and WebSocket ownership checks added; vendors, crafting, trading, production observability and load testing remain. |

## Latest implementation batch
- Added the Inventory & Equipment panel (I) with item counts, equipped weapon/body slots and displayed ATK/DEF bonuses.
- Keyboard controls: 1 equip novice sword, 2 equip cloth tunic, 3 unequip weapon, 4 unequip body. Server validates ownership and slot, then returns displaced gear to inventory.
- Added a server-side item catalog for slime gel, novice sword and cloth tunic.
- New characters receive one novice sword and cloth tunic in their inventory.
- Equip/unequip requests validate item ownership and equipment slot on the server; replaced gear returns to inventory.
- Equipment slots are persisted in MySQL and replicated in world snapshots.
- Added an in-game Quest Journal panel anchored to the HUD.
- The panel is driven by the server's persisted quest snapshot, not client-side quest state.
- Displays the correct guidance for available, active, ready-to-claim and claimed states.
- Shows kill progress and a progress bar; press J to show/hide the panel.
- Existing E interaction remains the authoritative NPC start/turn-in action.

- Equipment bonuses are calculated server-side: +5 ATK from novice sword and +3 DEF from cloth tunic; damage reduction never lowers a hit below 1.
- Fixed invalid literal newline markers in the inventory HUD TypeScript and connected I / 1–4 keyboard controls.
- Green Slime loot is now driven by a drop table; gel quantity rolls from 1 to 2.
- Inventory accepts at most 20 distinct item stacks; gel stacks to 99 and equipment stacks to 1. Overflow remains on the ground.
- NPC dialogue is loaded from Tiled object properties; quest objectives and rewards are defined in QuestCatalog.
- Basic attacks and skills now both advance only quests matching the defeated monster type.
- Added account registration/login/logout and session restoration endpoints. Passwords use PBKDF2-HMAC-SHA256 with random salts; raw tokens are never stored in the database.
- Each account is provisioned one starter character. Character rows now carry account_id, and WebSocket connect rejects invalid sessions or non-owned character IDs.
- Added browser sign-in/register screen, persisted session restore and sign-out; the world only starts after authentication succeeds.
- Added per-IP login and registration throttles (8 login attempts / 15 minutes; 4 registrations / hour) with bounded in-memory tracking.
- Moved the WebSocket credential out of the URL into a custom `Sec-WebSocket-Protocol` handshake value.
- Added logout-all to revoke every active session belonging to the authenticated account.
- Added account-owned character metadata, a maximum of three characters per account, character list/create/select endpoints and a selection screen.
- Added server-side class definitions: Warrior (120 HP, +3 ATK, +2 DEF), Mage (90 HP, +8 ATK), Archer (100 HP, +5 ATK, +1 DEF). Class stats apply to basic/skill damage, monster damage mitigation and respawn health.
- Player snapshots now include character name/class; remote player nameplates use the selected character name.

## CI results
- Workflow: `.github/workflows/ci.yml`.
- Equipment + HUD + combat stats: [run 44238329614 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44238329614).
- Loot/drop-table and inventory limits: [run 44238861303 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44238861303).
- Quest/NPC catalog batch: [run 44239442720 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44239442720).
- Account authentication batch: [run 44240885387 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44240885387).
- Auth hardening batch: [run 44241375845 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44241375845).
- Multi-character selection batch: [run 44242288598 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44242288598).
- Class-specific combat stats: [run 44242662962 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44242662962).

## Current risks
1. Character, monster and drop visuals remain original procedural placeholders.
2. Monster navigation uses a 24px grid; hitbox-aware movement and path smoothing remain.
3. Session token is sent as a custom WebSocket subprotocol; production handshake/header logging must redact credentials, and public deployments must use WSS.
4. Browser stores the opaque session token in localStorage; XSS hardening and CSRF/rate-limit policies need production review.
5. Heartbeat, reconnect, rate limiting, multi-character selection, consumables, vendors, crafting and trading remain.

## Next implementation sequence
1. Add refresh-token rotation and secure cookie strategy for browser sessions.
2. Implement class-specific skill kits, resource costs and progression growth.
3. Produce original character spritesheets, add catalog entries and verify all directional/action clips in-game.
4. Expand quest/NPC catalogs, gameplay integration coverage, observability and load testing.


## Latest implementation batch — class skill kits
- Replaced the two generic skills with six class-specific skills: Warrior (Power Strike, Shield Break), Mage (Arcane Bolt, Frost Shard), Archer (Quick Shot, Piercing Arrow).
- Skill ownership is validated on the server; attempting to cast another class's skill is rejected.
- Added class-specific maximum mana (Warrior 100, Mage 140, Archer 110), per-skill mana costs and passive regeneration at 8 mana/second.
- Server snapshots publish current/max mana and the active character's skill catalog; the HUD shows HP and MP.
- Shift and Q map to the selected character's first and second class skills. Damage, range, cooldown and resource spending remain server-authoritative.
- Mana is stored on each character row, restored and capped against the current class/level maximum at login, regenerated server-side, and saved with normal character persistence. Level-based skill unlocks remain follow-up work.


## Latest implementation batch — class growth by level
- Added server-side per-level growth curves: Warrior +12 HP/+2 ATK/+1 DEF; Mage +7 HP/+3 ATK; Archer +9 HP/+2 ATK/+1 DEF.
- Maximum mana grows per level: Warrior +5, Mage +8, Archer +6; mana regeneration remains 8/second.
- Basic attacks, skills, monster damage mitigation, max HP and max mana now use the character's current level.
- On level-up, the character gains the corresponding increase to current HP as well as maximum HP.
- Added unit coverage for all three class growth curves; skill combat tests now pass the authoritative character level.


## Latest implementation batch — hybrid character renderer adapters
- Refactored CharacterEntity to accept a visual adapter while retaining the procedural renderer as a fallback.
- Added SpriteSheetCharacterAdapter for directional/action animation keys, feet-pivot alignment, logical display sizing, depth sorting and lifecycle.
- Added SpineCharacterVisualAdapter as a plugin-version-neutral bridge over a Spine display object and animation map.
- Both adapters expose a camera target and share CharacterEntity's nameplate/HP overlay behavior.
- No character art or Spine runtime was fabricated: texture loading, animation registration and original character assets are still required before the game switches away from its procedural fallback.


## Latest implementation batch — persistent character mana
- Added a non-null mana column to player character persistence (existing rows receive the default value).
- Character login restores saved mana and clamps it to the current class/level maximum; cooldowns intentionally reset on a fresh world session.
- Character saves now persist mana after casts and during the existing movement/combat/loot/respawn persistence lifecycle, while applying server-side regeneration.
- Added a SkillCombatService restore entry point so client input cannot choose or overwrite the resource value.


## Latest implementation batch — level-gated class skills
- Each class's primary skill is available at level 1; its secondary skill unlocks at level 3.
- The server validates the required level before charging mana or applying damage.
- World snapshots only advertise skills currently unlocked for that character's class and level.
- Added coverage for locked-skill rejection and the level-3 unlock boundary.


## Latest implementation batch — spritesheet animation pipeline
- Added a typed character sprite catalog describing texture path, frame dimensions and per-action/per-facing frame ranges.
- GameScene now preloads catalogued spritesheets, registers their Phaser animations and requests a sprite adapter for local and remote character entities.
- Registry validates texture presence, frame ranges, duplicate character keys and duplicate Phaser animation keys before registering clips.
- CharacterEntity retains its procedural fallback whenever no catalog entry exists; the catalog is intentionally empty until original character art is supplied.
- No original character artwork is included in this batch, so the in-game appearance remains procedural for now.


## Latest implementation batch — mobile touch controls
- Added a mobile-only virtual joystick anchored to the lower-left viewport; it supports continuous analog movement, a dead zone and a capped radius.
- Added touch action buttons for basic attack and both class skill slots, reusing the same server-authoritative combat requests as keyboard controls.
- Enabled three active Phaser pointers so joystick movement and action taps can be used together on multi-touch devices.
- Touch pointer listeners are detached during scene shutdown; desktop keyboard controls remain unchanged.
- Responsive positioning for the rest of the HUD and device/browser playtesting remain outstanding.


## Latest implementation batch — remote player facing and CI correction
- Remote player entities now update their cardinal facing from consecutive authoritative snapshot positions; diagonal movement chooses the dominant axis and exact ties resolve vertically.
- Facing is presentation-only and is not accepted as client-authoritative movement state.
- Removed an unused joystick background field that caused TypeScript noUnusedLocals to fail in the preceding mobile-controls commit.
- The prior batch's server Maven tests passed; its client typecheck failed solely on that unused field. This batch removes the compile error; the new CI run is the verification gate.


## Latest implementation batch — remote character action replication
- Accepted basic attacks and skill casts are now broadcast to all connected players on the same map with the server-authenticated source character ID.
- Monster attacks publish a hit-reaction event for the affected player; clients animate the matching remote character.
- Remote characters continue to derive idle/walk and cardinal facing from interpolated authoritative snapshot movement; combat events temporarily switch them to attack, cast or hit and CharacterEntity returns to movement/idle after the configured action duration.
- Combat events are presentation-only and do not change client authority over damage, movement, targets or cooldowns.
- CI verification for this batch is pending.


## CI correction and remote vitals replication
- Fixed the server compilation failure found by CI: the skill-cast event has 11 fields and now uses `Map.ofEntries`, avoiding the Java `Map.of` 10-pair overload limit.
- Remote player snapshots now update the remote character HP bar and death state. A later positive-HP snapshot restores the idle/walk state after respawn.
- Previous CI result: client typecheck/build passed; server compilation failed only at the oversized skill-cast `Map.of` call. New CI run is pending.


## Character animation replay refinement
- SpriteSheet and Spine adapters now suppress redundant replay only for looping idle/walk clips.
- Repeated attack, cast and hit events restart the same non-looping animation even when the animation key has not changed.
- This keeps rapid consecutive combat actions visible instead of silently dropping repeated action transitions.


## Latest implementation batch — class-aware character art selection
- Local and remote player renderers now request spritesheet catalog entries by the server-replicated class code (Warrior/Mage/Archer) instead of using one generic remote-player key.
- When the first authoritative snapshot identifies the local character class, GameScene can switch the local renderer to that class's catalogued visual while preserving the current position and HP state.
- The catalog remains empty until original project-owned character art is added; procedural rendering remains the expected fallback and no artwork is claimed as integrated.


## Latest implementation batch — character renderer snapshot and catalog safeguards
- Local character HP is now applied from each authoritative world snapshot, so the local HP bar/death presentation follows server state just like remote players.
- Local and remote class-keyed renderer selection is now prepared for the future Warrior/Mage/Archer sprite catalog.
- Sprite registration rejects invalid sheet dimensions/paths, non-positive frame rates, invalid repeat counts and duplicate directional clips before Phaser animation registration.
- No original art is present yet; the procedural renderer remains the active fallback.


## Character art hand-off specification
- Added a project-owned asset contract covering directory layout, transparent row-major spritesheets, frame indexing, feet pivot, logical display sizing, action/facing coverage, looping rules and class-keyed catalog registration.
- Documented the Spine integration boundary: the adapter is runtime-neutral, and a concrete plugin/runtime must not be selected until a real skeleton export is available.
- Added an acceptance checklist for repeated combat animation, death/respawn, overlays, depth sorting and desktop/mobile review.
- No PNG or Spine export is committed; art integration remains blocked on original project-owned character assets.


## Latest implementation batch — class-distinct procedural fallback
- The local renderer now switches to the server-replicated class key even when no art catalog entry exists, instead of staying on the generic starter key.
- Procedural fallback characters now have distinct Warrior, Mage and Archer palettes and recognizable weapon silhouettes (sword, staff/orb, bow).
- This is a temporary gameplay/debug representation; it does not replace original character sprites or Spine art.


## Latest implementation batch — live vitals and directional combat animation
- CharacterEntity now tracks the authoritative maximum HP separately from its initial visual definition; level-up max-HP growth updates the local and remote HP bars without requiring entity recreation.
- Local and remote snapshots now pass both current HP and maximum HP into the renderer.
- If a replicated movement snapshot changes a character's facing while it is in attack/cast/hit, the visual adapter replays the active action in the new direction rather than leaving the effect facing the previous direction.
- HP remains clamped to the latest server-provided maximum; zero HP/death and positive-HP respawn transitions remain unchanged.


## Latest implementation batch — event-driven monster hit feedback
- Monster damage numbers and impact visuals are now driven by accepted server combat events, not inferred from HP snapshot deltas.
- Basic attacks display a white floating damage number; skill hits use a larger cyan number.
- Added a short expanding impact ring and brief monster hit flash for confirmed hits.
- Removed snapshot-based floating numbers to prevent duplicate damage popups when both combat events and HP snapshots arrive.
- Critical-hit styling is intentionally not shown because the current authoritative combat event does not expose a critical-hit flag.


## Latest implementation batch — authoritative player hit feedback
- Removed the stale monster HP cache that was no longer read after damage popups moved to authoritative combat events; this restores strict TypeScript typecheck.
- Local and remote player characters now show a red floating damage number and enter the hit-reaction animation when the server reports a player-hit event.
- Local-player hits are matched by the authenticated player ID, while remote-player hits continue to target the corresponding replicated character.
- Monster hit damage remains event-driven; snapshot HP updates do not create duplicate damage numbers.
- Monster attack events now report the post-defense damage actually applied to player HP, rather than the raw pre-mitigation attack value.


## Latest implementation batch — combat event ordering and skill impact
- Added a short-lived per-monster combat-event queue so accepted hits are retained when a combat frame arrives before the snapshot that creates the target monster entity.
- Queued hits are replayed against the newly created monster on the next matching snapshot, with a 1.5-second expiry and an eight-event per-monster cap to bound stale presentation state.
- Pending events are pruned during the scene update loop and cleared on scene shutdown; authoritative damage and HP remain snapshot/server-owned.
- Skill hits now render a second, wider cyan impact ring in addition to the base impact ring and damage number; basic attacks retain the simpler white impact.
- No guessed critical-hit state or client-side damage calculation was introduced.


## Latest implementation batch — out-of-order remote player hit feedback
- Added a bounded per-player queue for authoritative player-hit events that arrive before the corresponding remote-player snapshot creates its renderer.
- Pending hits replay when that remote character is first created; events expire after 1.5 seconds and are capped at eight per player.
- Expired entries are pruned during the scene update loop, and all pending player-hit state is cleared during scene shutdown.
- Existing remote hit events still apply immediately when the target renderer exists; local-player handling and server-authoritative HP snapshots remain unchanged.


## Latest implementation batch — stabilize character action lifecycle
- Avoid replaying the same directional animation when a snapshot repeats the current facing; this prevents unnecessary restarts of one-shot clips.
- Prevent repeated zero-HP snapshots from restarting the death animation every replication tick.
- Preserve the existing authoritative respawn transition: a character whose HP rises from zero exits death into walk/idle based on movement state.


## Latest implementation batch — align directional one-shot animation timing
- When a character changes facing during attack, cast or hit, the visual adapter restarts the matching directional clip; the logical action timer now resets at the same moment.
- Applied the same rule to explicit facing changes, preventing a restarted clip from being cut off by elapsed time accumulated on the previous direction.
- Looping idle/walk behavior and the death hold state are unchanged; server-authoritative combat and movement are unaffected.


## Latest implementation batch — WebSocket heartbeat and reconnect
- The client now sends an application-level heartbeat every 20 seconds and closes a connection that does not answer within 10 seconds.
- The server answers heartbeat messages with a pong frame without routing them through gameplay command handling.
- Unexpected disconnects trigger bounded exponential reconnect delays (1–30 seconds); scene shutdown cancels reconnect and heartbeat timers.
- Authentication continues to use the existing session token and selected character when reconnecting; gameplay authority and snapshot handling are unchanged.


## Latest implementation batch — stop reconnecting after authentication rejection
- The WebSocket client now distinguishes retryable disconnects from server policy-violation closes (1008).
- Invalid/expired session credentials and character ownership rejections no longer trigger an endless reconnect loop with the same credentials.
- Transient network failures and heartbeat timeouts continue to use bounded exponential reconnect; scene shutdown behavior is unchanged.


## Latest implementation batch — recover from rejected world sessions
- Replaced the WebSocket connected boolean with explicit connection states: connecting, connected, reconnecting and authentication-required.
- Policy-violation close code 1008 now surfaces a terminal authentication/character-selection state instead of leaving the player in an offline-prediction world with no reconnect path.
- The application tears down the rejected game session, revalidates the stored account session, then returns a valid account to character selection; expired/invalid account sessions return to sign-in.
- Transient disconnects continue bounded exponential reconnect, and the existing heartbeat and scene shutdown lifecycle remain intact.


## Documentation correction — current world transport contract
- Corrected the network protocol to state that the session token is sent via the `auth.<token>` WebSocket subprotocol, not in the URL query string.
- Updated current limitations to distinguish existing per-IP authentication throttles from the still-pending world-message limiter.
- Documented the implemented 20-second ping, 10-second pong timeout, bounded reconnect and terminal close-1008 recovery flow.
- Clarified that remote player rendering exists while original character art integration remains pending.


## Latest implementation batch — world WebSocket message rate limits
- Added per-connection, per-message-type fixed-window limits before gameplay dispatch, so excess client frames are discarded before database persistence, simulation calls or map broadcasts.
- Movement accepts up to 30 frames/second, preserving headroom over the current 20 Hz client input cadence; basic attacks and skill casts accept up to 5 requests/second and continue to rely on their authoritative combat cooldowns.
- NPC interaction and inventory/equipment commands accept up to 3 and 5 requests/second respectively; heartbeat is capped at 2/second and unsupported message types at 10/second.
- Rate-limit state is synchronized per connection and removed on WebSocket close. Rejected frames are dropped without sending an error for every excess frame, preventing response amplification.
- This is an in-process per-connection safeguard; cross-instance/global quotas and distributed abuse controls remain production work.


## Latest implementation batch — bound inbound world WebSocket work
- Added an 8,192-character inbound message ceiling before JSON parsing; oversized client frames are closed with WebSocket status 1009.
- Normalized all unsupported and missing message types into one shared per-connection rate-limit bucket. Arbitrary client-supplied type strings can no longer grow the per-connection window map without bound.
- Kept the existing per-command budgets and server-authoritative gameplay flow unchanged.
- Documented an important boundary: the handler guard limits JSON parsing and dispatch, but the WebSocket container may already have buffered the frame; configure container-level frame limits at deployment for protection against oversized transport allocation.


## Latest implementation batch — WebSocket transport hardening
- Configured the servlet WebSocket container to cap inbound text and binary message buffers at 8,192 bytes, so oversized frames are rejected at the transport/container boundary before the application handler parses them.
- Set a 10-second asynchronous send timeout to avoid indefinitely stalled outbound socket writes.
- Replaced the wildcard WebSocket origin pattern with an exact-match allowlist configured through `WEBSOCKET_ALLOWED_ORIGINS`; local development defaults to the two Vite localhost origins.
- Documented the deployment requirement to set the public frontend origin explicitly. The handler-level 8,192-character guard remains as defense in depth.


## Latest implementation batch — validate inbound world message shape
- The world gateway now rejects empty JSON payloads, JSON `null`, arrays and primitive JSON values with a controlled protocol error instead of dereferencing a null root node.
- Malformed JSON is caught and answered with a bounded generic error message; parser exceptions no longer escape the message handler.
- Valid object messages continue through the existing per-type limiter and authoritative command validation.

## Latest implementation batch — stop retrying terminal WebSocket protocol closes
- The client now treats WebSocket close codes 1002, 1003, 1007, 1009 and 1010 as terminal for the current connection attempt instead of entering the automatic reconnect loop.
- The world HUD displays a protocol-error state with a reload instruction; authentication close 1008 retains its existing account revalidation and character-selection recovery flow.
- Transient disconnects and heartbeat timeouts remain retryable with the existing bounded exponential backoff.
- Updated the network protocol document to distinguish terminal protocol/data errors from retryable transport failures.

## Latest implementation batch — validate typed world command fields
- The world gateway now requires a textual message type instead of coercing arbitrary JSON values into command names.
- Movement commands require an integral sequence number and finite JSON numeric axes; string-encoded numbers, missing fields and non-finite values are rejected.
- Attack and skill targets, skill IDs, NPC IDs, equipment codes and equipment slots must be non-empty strings no longer than 128 characters.
- Validation remains server-side and uses the existing controlled error response path; movement authority, rate limits and combat rules are unchanged.


## Latest implementation batch — enforce inventory capacity during equipment swaps
- Equipment replacement now returns the displaced item through the same catalog-backed inventory capacity and stack-limit rules used by loot pickup.
- Unequip now checks that the item can be returned to inventory before changing the player's equipment state.
- A full 20-slot inventory can still accept a returned item when its existing stack has room; otherwise the equipment operation is rejected without mutating player state.
- Added coverage for returning an item into an existing stack while all 20 inventory slots are occupied.


## Latest implementation batch — scale recipient-private world snapshots
- Changed map broadcasts to construct public player, monster and loot snapshots once, then reuse those immutable views for every recipient on that map.
- Inventory, equipment, item catalog and quest progress now travel in a separate recipient-only `selfState` field; remote player entries never contain those fields.
- The client merges `selfState` into its own player record before dispatching the snapshot, keeping the existing game scene and HUD contract intact.
- Snapshot construction is now O(N) per map broadcast for public state instead of rebuilding the N-player list N times; recipient-specific payload envelopes remain O(N).
- CI is the verification gate for this batch.


## Latest implementation batch — authoritative class stats in inventory HUD
- Removed the client-side Warrior/Mage/Archer base-stat lookup from the inventory panel.
- The server now includes level-adjusted class ATK and DEF in each public player snapshot using ClassCatalog, alongside authoritative max HP.
- The inventory panel displays those server values and uses a syncing placeholder if the stats are not present, avoiding stale duplicated balance data in the client.
- Equipment bonuses continue to be calculated from the server-provided item catalog and equipped slots.
- CI is the verification gate for this batch.


## Latest implementation batch — throttle movement database writes
- Kept authoritative movement validation and real-time snapshot broadcast unchanged.
- Added a per-connection 5-second position persistence gate; accepted movement packets no longer trigger a database save on every packet.
- Initial character state and the latest state on WebSocket disconnect are still persisted. Other gameplay state changes continue using immediate persistence.
- This trades a maximum 5-second movement-position rollback on abrupt process failure for substantially fewer database writes under active movement.
- CI is the verification gate for this batch.


## Latest implementation batch — per-player world interest area
- World snapshots now use a server-side circular AOI radius of 900 world pixels for each recipient.
- The recipient's own player entry is always retained; only nearby players, living monsters and loot drops are included in that recipient's snapshot.
- Recipient-private inventory, equipment, item catalog and quest state remain in the existing `selfState` boundary.
- The client already destroys monster and loot renderers absent from the latest snapshot and applies a 1.5-second grace period to remote players, so entities naturally leave and re-enter rendering as they cross the AOI boundary.
- Snapshot delivery now uses a uniform spatial grid (300 world pixels per cell), built once per map broadcast for players, monsters and loot. Each recipient queries intersecting cells and receives only exact in-radius results, rather than scanning all entities independently. The recipient is explicitly retained even if its snapshot position is malformed/outside the query.
- Combat events now route around the source player (or hit player for monster attacks): source/target participants always receive them, while other players receive them only inside the 900-pixel interest radius. Events without a resolvable participant retain map-wide delivery as a safe fallback.
- CI for spatial indexing passed: server Maven test/package and client typecheck/build succeeded.


## Latest implementation batch — coalesce world snapshot broadcasts

- Replaced synchronous snapshot serialization on every movement/state-change callback with a pending-map queue.
- A 50 ms scheduled flush sends one latest-state snapshot per pending map, coalescing multiple movement and simulation changes within the same interval and bounding snapshot flushes to 20 Hz per map.
- Combat events remain on their immediate routing path, so combat presentation is not delayed by snapshot batching.
- The existing 100 ms world simulation tick continues to mark connected maps pending, preserving periodic authoritative snapshots when players are idle.
- Delta snapshots, payload compression and runtime load measurements remain outstanding.
- CI is the verification gate for this batch.


## Database configuration correction — use existing local MySQL

- Replaced the MySQL JDBC runtime driver with MySQL Connector/J.
- Spring datasource now defaults to local MySQL at `localhost:3306/mmorpg`, driver `com.mysql.cj.jdbc.Driver`, username from `DB_USERNAME` (default `root`) and password from `DB_PASSWORD` (default `123456`).
- The complete JDBC URL remains overridable through `DATABASE_URL`.
- Updated local setup instructions to use an existing MySQL 8.x service; no MySQL container is required.
- Removed the obsolete MySQL-only Docker Compose file to avoid accidentally starting a second database.
- CI is the verification gate for this batch; local database connectivity has not been tested from this environment.


## Latest implementation batch — local WebSocket handshake diagnostics
- Changed the local-development WebSocket origin policy to allow arbitrary ports only on `localhost` and `127.0.0.1`. This covers Vite's automatic fallback ports when 5173 is already occupied without opening the endpoint to arbitrary remote origins.
- Kept production origin control configurable through `WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`; deployments should set an explicit trusted-origin list.
- Tightened handshake credential parsing to the exact 32-byte URL-safe Base64 session token generated by AuthService (43 characters).
- Added safe server-side rejection logs for missing or malformed auth subprotocols. Logs include the Origin but never the token.
- Missing/malformed handshake credentials now return HTTP 401; origin-policy rejections remain HTTP 403.
- Local verification is still required: restart the backend and confirm the browser's WS request reaches `101 Switching Protocols`. A valid handshake followed by close code 1008 indicates session/character validation, not an origin handshake rejection.


## WebSocket Origin pattern correction
- Corrected the Spring `allowedOriginPatterns` port wildcard to its documented bracket form (`:[*]`). The previous `:*` form does not express Spring's wildcard-port syntax and can still reject the browser Origin with HTTP 403.
- Local validation remains pending restart and browser handshake confirmation.


## Latest implementation batch — negotiate the authenticated WebSocket subprotocol
- Configured the world WebSocket handshake handler to select and echo the offered `auth.<session-token>` subprotocol after the handshake interceptor validates its format.
- This addresses the browser error where the client sent `Sec-WebSocket-Protocol` but the server returned no selected protocol; the token remains excluded from URL query parameters and application logs.
- Runtime verification still requires pulling the commit, restarting the backend and confirming HTTP `101 Switching Protocols` in the browser Network panel.


## Latest implementation batch — live world snapshot diagnostics
- Added a compact in-game world-state line showing the authoritative map ID and the counts of players, monsters and loot drops in each received snapshot.
- The monster count changes color when the server is returning visible monsters, making AOI/spawn/snapshot problems distinguishable from a rendering or connection problem during local playtesting.
- Moved the keyboard-help line down to preserve spacing; gameplay behavior and server authority are unchanged.
- World snapshot receipt is now observable in the running client; multi-map registry and portal transitions remain the next implementation milestone.


## Latest implementation batch — multi-map world data foundation
- Added the authoritative server-side Tiled resource for Starter Meadow, matching the client map data.
- Added a second original prototype map, Forest Edge, to both client public assets and server classpath resources.
- Registered both maps in the server world registry, so movement geometry and monster simulation initialize independently per map.
- Forest Edge includes its own spawn point, collision object and Green Slime spawn region; portal interaction and client map swapping are the next step.
- This batch establishes map data and server registration only; players cannot transition between maps until the portal protocol is implemented.


## Latest implementation batch — authoritative portal definitions
- Extended server Tiled map loading with validated portal metadata: destination map ID and destination coordinates.
- Added the portal geometry model and two-way portal definitions between Starter Meadow and Forest Edge.
- Portal destinations are map-space coordinates; the world handler now has the metadata needed to validate and apply transitions server-side.
- Client-side map swapping and server movement-trigger integration are the next part of the multi-map slice.


## Latest implementation batch — server-authoritative map transition
- Movement now checks the active map's portal rectangles after server-side collision resolution.
- Entering a portal validates its destination map and coordinates against the registered map geometry, then changes the player's authoritative map and position.
- The character's new map and coordinates are persisted immediately; both source and destination map snapshots are scheduled for broadcast.
- The server emits a `map-transition` message to the player. Client-side map replacement and camera/collision reset remain to be completed.


## Latest implementation batch — client map transition rendering
- Preloaded both Starter Meadow and Forest Edge Tiled assets in Phaser.
- Added a typed WebSocket map-transition event and listener lifecycle.
- On the server-authoritative transition event, the client swaps map renderer and collision controller, updates camera bounds/position and NPC definitions, and clears entities from the previous area.
- The client does not decide when a portal activates; only the server movement/portal check can initiate a map transition.


## Latest implementation batch — data-driven map registry
- Replaced hardcoded server map registration with a Tiled map manifest at `maps/index.json`.
- The loader validates manifest entries, rejects unsafe resource paths and duplicate map IDs, then loads each registered map.
- Fixed Forest Edge return portal data so exactly one portal definition carries valid destination metadata.
- Portal target validation remains centralized in the registry; adding a map now requires registering its resource and defining valid portal links.


## Latest implementation batch — client consumes map manifest
- Phaser now loads `maps/index.json` first, validates the registered map filenames and queues each Tiled map asset from the manifest.
- The initial map remains required to be `starter-meadow`; subsequent map transitions can resolve any registered map asset without adding another hardcoded preload line.
- Client and server now use matching map manifests, reducing the chance that a server portal points to a map the client has not loaded.

## Latest implementation batch — per-map NPC registry and multi-quest journal
- Added a server-side NPC registry that resolves NPC IDs only within the player's authoritative current map; unknown NPC IDs and NPCs on another map are rejected.
- Added the Forest Warden to Forest Edge and registered a second quest, so the world now has separate Meadow and Forest quest-givers.
- Reworked quest snapshots to expose the full quest list with available, active, ready-to-claim and claimed states while retaining the legacy default-quest field for compatibility.
- Quest objective progress now respects each quest's configured kill count instead of always stopping at three.
- Expanded the in-game quest journal to display up to three quest entries and their current objectives/progress.
- Existing quest persistence remains keyed by character ID and quest ID; existing character quest records are preserved.
- GitHub Actions and local runtime verification are pending for this batch.

## Latest implementation batch — regional monster drop tables
- Monster drop resolution now receives the authoritative map ID and selects a map-specific table before falling back to the shared monster table.
- Starter Meadow Green Slimes retain the existing Green Slime Gel drop.
- Forest Edge Green Slimes can additionally drop Forest Resin at a configured 35% chance; the new material is registered in the server item catalog and can enter player inventory through the existing loot pickup flow.
- Added coverage for the Forest Edge-specific drop path using a deterministic random source.
- GitHub Actions passed on commit af02557a8e99174513837b771c0fb6e9155bc091 (Maven test/package and client typecheck/build); local runtime playtest remains pending.

## Latest implementation batch — minimap, area name and world map overlay
- Added an area-name HUD label that updates on authoritative map transitions.
- Added a screen-fixed minimap showing the current map bounds, NPCs, monster spawn areas, portals and the player's live position.
- Added the M-key world map overlay, populated from the same client map manifest; it lists every registered area, highlights the current area and displays portal connections resolved from Tiled metadata.
- Minimap and world-map content are rebuilt when the player changes maps; the server remains authoritative for all actual map transfers.
- GitHub Actions passed on commit af02557a8e99174513837b771c0fb6e9155bc091 (Maven test/package and client typecheck/build); local runtime playtest remains pending.

## Quest objective correctness — map-scoped kill progress
- Each quest now declares its target map as well as its target monster type.
- The world gateway passes the server-authoritative current map into quest progression; meadow kills can no longer advance the Forest Edge objective, and vice versa.
- Added regression coverage for kills on the wrong map.
- GitHub Actions passed on commit af02557a8e99174513837b771c0fb6e9155bc091 (Maven test/package and client typecheck/build); local runtime playtest remains pending.
