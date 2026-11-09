# KPAH 2.7.8 client reverse-engineering notes

## Reference artifact

- File: `KPAH_278.jar`
- Size: 1,099,370 bytes
- MIDlet: `game.GameMidlet`
- Display name: Khi Phach Anh Hung
- Vendor: TeaM
- Client version: 1.5.9
- Runtime: MIDP 2.0 / CLDC 1.0
- Archive inventory: 1,024 entries, including 782 `.class` files, 29 PNG files, 8 `.sh` files, 5 `.wp` files, and 5 `.wps` files.

The class names are mostly obfuscated. Do not infer class responsibilities from short class names; trace references from `game.GameMidlet` and inspect resource loaders/rendering call sites.

## Resource families observed

- `.sh`: packed client data (includes `main.sh`, `npc.sh`, `eff.sh`, `font.sh`, `arrow.sh`, `box.sh`, `g.sh`, `skillpublic.sh`).
- `.wp` and `.wps`: use the same indexed/XOR container as `.sh`; splash resources include `wpsplash/0.wp` through `wpsplash/4.wp`, while the five `.wps` packs contain character-line preview PNGs.
- `.png`: UI, font, icon, and sprite-sheet images. Examples include `logo.png`, `icon.png`, `font/*`, `sword skill/*`, and `rong/*`.
- Extensionless entries: retain their original names and inspect their headers before assigning meaning.

## Reproducible extraction

From the repository root:

```bash
python tools/extract_kpah_jar.py KPAH_278.jar
```

This extracts non-class resources to `public/assets/kpah-original/` and writes
`archive-manifest.json`. The script rejects archive paths that would escape the
output directory. To extract class files for offline inspection as well:

```bash
python tools/extract_kpah_jar.py KPAH_278.jar --include-classes
```

Do not check generated class dumps or extracted assets into Git until their format,
licensing, and intended use in the recreation have been reviewed. Keep the original
JAR unchanged as the reference artifact.

## Current reconstruction boundary

The Web client currently contains a mock world and mock panels. It is not yet a
faithful reproduction of the original screens. Backend behavior and network protocol
remain intentionally out of scope until agreed with the project owner.

## Verified screen and protocol findings

- `uj`: initial server selector; startup worker activates it. It has nine built-in server entries and can refresh them from the original server-list URL.
- `ro`: login screen with Game ID and Password fields.
- `lj`: existing-character selection screen.
- `ls`: character creation/configuration screen with five character lines, two genders, and six hair choices.
- `li`: loading/entry transition after selecting a character.
- `mj`: main in-world Canvas renderer/state.
- `tb`: guild/menu interface.
- Login request: opcode 1; registration: opcode 39; character selection: opcode 13; character creation: opcode 14.
- Socket framing and the initial connection handshake are documented separately. The endpoint is selected from the server list, not a single hardcoded host.

Detailed traces:

- [Startup and Canvas](startup-and-canvas.md)
- [Screen states](screen-state-trace.md)
- [Server selection](server-selection-trace.md)
- [Authentication requests](authentication-request-trace.md)
- [Socket transport](socket-transport-trace.md)
- [Packed resource format](resource-pack-format.md)

## Next investigation sequence

1. Inspect the decoded `.wp` companion `.d` metadata and integrate the five `.wps` character-line preview packs into character creation.
2. Trace the map-entry response and initialization of `mj`, including its render-ready state and camera/tile setup.
3. Decode the font data records and map sprite sheets, tile sets, and UI panels to screen classes.
4. Replace the mock server/login/character flow and then the mock world HUD incrementally using verified dimensions and assets.
5. Record every inferred mapping with the class/method or resource evidence that supports it.
