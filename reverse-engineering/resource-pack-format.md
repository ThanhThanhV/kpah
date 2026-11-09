# Packed resource format: `.sh`

Verified against the original loader `ba` and all eight `.sh` files in `KPAH_278.jar`.

## Container format

The original loader uses the repeating XOR key:

```text
NguyenVanMinh
```

The archive layout is:

1. Unsigned byte: number of internal resources.
2. For each resource:
   - Signed byte: resource-name byte length.
   - Resource-name bytes, XORed with the key starting at key index 0.
   - Unsigned big-endian 16-bit resource byte length.
3. All resource payloads concatenated in index order, XORed as one continuous byte array with the key starting at key index 0.

The client reads the concatenated payload fully, applies the repeating XOR key once to the whole payload, and indexes each internal file by cumulative offsets and lengths. The name XOR restarts for each name; the payload XOR restarts once at the beginning of the concatenated payload.

All eight supplied `.sh` files pass the format checks: header lengths sum exactly to the payload length, with no trailing bytes.

## Decoded inventory

| Pack | Internal entries | Typical contents |
|---|---:|---|
| `main.sh` | 43 | HUD, inventory panels, elemental icons, status bars, map markers, UI sprites |
| `font.sh` | 29 | Font bitmap/metric data |
| `npc.sh` | 34 | NPC sprite images |
| `eff.sh` | 38 | Effect sprite sheets |
| `arrow.sh` | 7 | Arrow/indicator sprite sheets |
| `box.sh` | 2 | Small panel/frame assets |
| `g.sh` | 3 | Small game UI icons |
| `skillpublic.sh` | 1 | Shared shop/skill UI sprite |

Across the packs this yields **157 internal resources**, including **128 PNG files**. The remaining entries include raw font data and related non-PNG records.

Examples confirmed in `main.sh` include:

- `info.png`, `inv_0.png`, `inv_1.png`, `inv0.png`, `inv1.png`, `inv2.png`
- `panel.png`, `panel150x36.png`, `nguhanh.png`, `mauquai.png`
- `waypoint.png`, `wicon.png`, `cooldown.png`, `shadow.png`

The image sheets are deliberately small/pixel-art assets; preserve their native pixel dimensions and use nearest-neighbor scaling in the Web renderer.

## Runtime loader and sprite slicing

- `ba.b(String)` loads a `.sh` pack into the static resource loader.
- `ba.a(String)` looks up an internal name with `.png` appended and creates a MIDP Image from the decoded byte range.
- `ba.c(String)` returns the raw decoded bytes for an internal resource.
- `ba.e(String)` returns a stream over an internal resource.
- `bc` is a vertical sprite-sheet frame helper. It stores a frame width and height and draws a selected frame with `Graphics.drawRegion`; the frame index selects the vertical source offset.

The Web extractor now implements this exact container/XOR format. Run:

```bash
python tools/extract_kpah_jar.py KPAH_278.jar
```

Decoded resources are written under `public/assets/kpah-original/decoded-sh/<pack-name>/`, while original `.sh` files remain preserved beside them. Use `--no-decode-sh` to disable decoding.
