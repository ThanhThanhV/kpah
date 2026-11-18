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
| 3.1–3.4 | Client/server foundation, world transport and CI | IN PROGRESS | Phaser, Spring Boot, PostgreSQL Compose, JPA persistence and GitHub Actions. |
| 4.1–4.5 | Character renderer and animation | IN PROGRESS | CharacterEntity now supports interchangeable concrete Phaser SpriteSheet and Spine display adapters with procedural fallback; original sprite/Spine assets and runtime-specific animation registration remain. |
| 5 | Map Engine | IN PROGRESS | Tiled map loading, rectangular collision and server-side grid pathfinding; map art and transitions remain. |
| 6.1–6.3 | Input, movement and facing | IN PROGRESS | Keyboard + mobile virtual joystick, touch attack and two class-skill buttons; client prediction and server-authoritative movement remain. Replicated facing and responsive HUD layout remain. |
| 7.1–7.3 | Monster definitions, AI and presentation | IN PROGRESS | Tiled spawn definitions, bounded roam, aggro, leash, attack cooldown, A* pursuit and snapshot-driven placeholder visuals. |
| 8.1–8.3 | Combat, damage, death and respawn | IN PROGRESS | Server validates basic/skill attacks; class and equipment ATK bonuses affect damage, class/equipment DEF mitigates monster hits (minimum 1), class-specific HP controls health and respawn. |
| 9 | Skills and visual effects | IN PROGRESS | Six class-bound skills with second skill unlocked at level 3, server-authoritative range/damage/cooldown/mana cost, class mana regeneration and PostgreSQL-persisted mana; area targeting and authored VFX remain. |
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
- Equipment slots are persisted in PostgreSQL and replicated in world snapshots.
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
