# Screen-state trace: login and character setup

This note records screen identities and layout facts confirmed from the KPAH 2.7.8 bytecode. Obfuscated class names are retained as identifiers; descriptive labels below are evidence-based interpretations, not renamed source symbols.

## State manager

- `km.q` is the active screen reference and has type `tj`.
- `tj` is an abstract screen base class extending `bw`.
- `tj.b()` assigns the current instance (`this`) to `km.q`, then enables full-screen mode.
- `tj.a(tj)` also assigns the current instance to `km.q`; the parameter is not used in the inspected bytecode.
- `km.paint(Graphics)` draws `km.q` first, then optional `md`, `sg`, and `xf` layers. This confirms a single Canvas with a current screen and independent overlays.

## Startup sequence after Canvas creation

The MIDlet creates `km`, makes it the current MIDP Displayable, and starts its run loop. The worker `kv.run()` waits until its startup flag is set, then performs the following sequence:

1. Calls `km.c()`.
2. Calls `km.sizeChanged(0, 0)`.
3. Calls `ku.k()`, `ku.h()`, and `ku.b()` to initialize game resources/data.
4. Connects the shared runtime objects `acv` and `jy`.
5. Calls `ku.f()` and initializes the UI/runtime helper `uj`.
6. Clears the loading flag in `km`.

`km.c()` constructs shared instances of `mj`, `ro`, `bl`, and `un`. The active state is stored separately in `km.q`; the constructor sequence alone does not establish which screen is first selected.

## Login screen: `ro`

The identification is confirmed by both UI text and drawing code:

- Visible labels: `Game ID:`, `Password:`, `Nhớ mật khẩu`, `Hotline:`.
- Actions: login (`Đăng nhập`), register (`Đăng ký`), and password recovery (`Nhớ mật khẩu` / recovery action).
- Two `wk` text-entry controls are created; the first is configured as the account field and the second as the password field.
- The class reads and writes the saved login preference under the RMS key `nqshlogin`; it stores a boolean and, when enabled, the two text values.
- It also reads the hotline/support value under `numbersupport`, falling back to a built-in numeric string when absent.
- The login action is wired through callback class `rp`; the other controls use `ru`, `rv`, and platform/menu callback classes.

### Measured layout anchors

Coordinates are derived from `km.o` (viewport center X) and `km.p` (viewport center Y):

- Background image `km.C` is drawn centered horizontally at approximately centerY - 70.
- Main panel is drawn at centerX - 70, centerY - 35 with size 140 × 100.
- Account label begins near centerX - 48, centerY - 26.
- Password label begins near centerX - 48, centerY + 10.

These are original logical pixel offsets, not CSS dimensions. The Web version should scale the composition proportionally while preserving the relative anchors.

## Character setup screen: `ls`

The class is identified as the character creation/setup screen from its labels, controls, and preview rendering:

- Labels rendered from bytecode: `Tên:`, `Dòng:`, `Giới tính:`, `Tóc:`, `L.thể:`, and `Ngũ hành:`.
- It renders a character preview using a `ca` object and draws the selected appearance at the viewport center.
- It loads the available character/appearance options from static `ab[][]` data.
- It exposes actions labeled `Đăng`, `Xóa`, and `Tạo` through callback objects.
- Its input handling cycles through option indexes and updates the preview data before drawing.

The labels and preview are direct evidence of a character-creation/configuration surface. Whether this screen also doubles as a character-selection screen in a later server response still needs confirmation from its callers and network callbacks.

## Other identified screen candidates

- `tb`: guild interface. Its strings include guild home, rankings, registration, missions, members, guild information, guild messages, skills, and guild chat. The same class also contains the in-game menu entries for inventory, skills, potential, equipment, quests, friends, world chat, and settings.
- `mj`: large shared game-state class with extensive world/game data and many in-game Vietnamese strings. It is not yet safe to assign it a single screen name from the class declaration alone.
- `ra`: guild list/management surface, based on strings including guild listing and management actions.
- `sj`: a compact menu/news/chat surface; exact role still under investigation.
- `xg`: complex world/game surface; exact role still under investigation.

## Next reverse-engineering targets

1. Trace callback classes `rp`, `ru`, and `rv` to establish login, registration, and password-recovery requests and state transitions.
2. Trace the callers of `ls.a()` and `ls.b()` to establish exactly when character creation appears and what follows successful creation.
3. Decode the `.sh` resource readers and map the login background, panel, fonts, and character preview assets.
4. Trace the main in-world class and network callbacks before implementing world HUD and gameplay behavior.


## Character setup option catalog

The `ls` static initializer contains five character lines, each with male and female variants:

| Character line | Weapon label | Region | Element |
|---|---|---|---|
| Kiếm Khách | Kiếm | Miền Bắc | Kim |
| Chiến Binh | Đại đao | Miền Bắc | Hỏa |
| Pháp Sư | Địa thần | Miền Nam | Thủy |
| Đấu Sĩ | Rìu | Miền Nam | Thổ |
| Cung Thủ | Cung | Miền Bắc | Mộc |

The screen also defines six hair options: `Đầu đinh`, `Tóc búi`, `Tóc cột cao`, `Tóc chéo`, `Tóc xù`, and `Tóc ngang vai`. The gender array is `Nam` and `Nữ`. These are exact option values in the class's static initializer; the display font may render accents differently under `javap` on a non-UTF-8 console.



## Character list screen: `lj`

`lj` is the character-selection screen shown after the server returns the account's character records:

- Its heading is `Chọn nhân vật:`.
- It stores the returned `ca[]` character array and renders up to three character previews in the visible row.
- The selected entry shows its character name and level, with additional status text when applicable.
- Available actions are `Chọn`, `Tạo mới`, `Xóa` (or `Khôi phục` for a recoverable entry), and `Thoát`.
- `Tạo mới` invokes `ls.a().b()`, opening the character-creation screen.
- `Chọn` sends the selected character identifier through `jy.i(id, 1)`, copies its appearance data into the shared player object `mj.t`, and starts the `li` loading/transition state.
- `Thoát` closes the socket and returns to the login screen.

This distinguishes the two screens: `lj` selects an existing character; `ls` creates/configures a new character.

## Loading transition: `li`

After choosing a character, `li.b()` activates a short transition state. Its renderer clears the screen to black, animates a small particle/trail field, and draws a 24 × 24 frame from a sprite resource. It periodically sends a small position/status request through `jy.b(int,int,int)` while the transition is active. Treat it as a loading/entry transition, not as the world screen.



## In-world Canvas state: `mj`

The class `mj` is the main in-world renderer/state, not just a passive data holder:

- It extends `tj` and its `b()` method calls `tj.b()`, making `mj` the active `km.q` screen, then runs its layout/update setup.
- Its `a(Graphics)` method is the world draw path. It resets the Canvas transform, applies camera offsets, draws world layers and map-backed objects, then iterates world entity collections and renders their sprite/animation frames.
- It references the active player object `mj.t`, map/camera coordinates, entity collections, and sprite records resolved through `mi`.
- The class also owns many in-game menu actions and labels (chat, inventory, guild/quest interactions), while `tb` is a separate menu/guild panel state.

This is the strongest current candidate for the core playable world scene. The next task is to trace how the character-selection response and map-entry response initialize `mj` and set its `v` render-ready flag, then map the tile/sprite readers to the original asset sheets.

