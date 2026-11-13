# Opcode 16 initialization state reducer

## Purpose

The generated initialization decoder parses the wire format. The separate client reducer applies only state mutations established by the original client handler. Parsing and mutation remain separate so the model can be tested without claiming a live server connection.

## Verified state transitions

| Mode | Wire data | Client state effect |
|---|---|---|
| 0 | signed 64-bit currency; indexed resource amount pairs; common trailing integers | Replace currency and update only resource catalog indices present in the packet. Other resource indices remain unchanged. |
| 1 | complete bo inventory record list | Replace the complete inventory snapshot. |
| 2 | two k record collections | Replace the auxiliary collection with the second collection (z.by). The first collection is parsed but is not retained by the shared-state callback. |
| 3 | signed-short counter list | Replace the counter-value array. Catalog labels/icons are supplied separately by opcode 1. |
| unknown | unrecognized mode payload | Preserve the existing state unchanged. |

The common aY and aZ fields are retained under neutral names because their business meaning is not established.

## Boundaries

- Resource indices are catalog positions, not resource IDs.
- The reducer does not infer item field meanings beyond the wire parser's neutral names.
- Currency remains a JavaScript bigint to preserve the original signed 64-bit value exactly.
- No packet is treated as proof of a successful client action; this is only a server-to-client state application model.
- This reducer is not yet connected to the offline Phaser demo, local-save format, socket transport, or a server session.

## Verification

Run npm run test:initialization-state to exercise mode 0 merge semantics, mode 1 full replacement, mode 2 second-collection replacement, mode 3 counter replacement, unknown-mode no-op behavior and immutability of previous state.


## Opcode 1 global initialization catalogs

`applyOpcode1(state, decodedPacket)` applies the verified opcode 1 data into a new immutable state:
- Global movement step and boat ticket price, global config bytes, optional block, hotline/URL and part-data parse status.
- Skill catalog, profession skill slot counts and five profession catalogs.
- Stat labels, paired lookup rows and quest objective labels.
- Tile blobs keyed by the two verified runtime keys and indexed part-data blobs.

Binary blobs are copied into fresh Uint8Arrays. Catalog indices and opaque records are preserved; this layer does not invent runtime rendering semantics for tile/part bytes. A failed/partial part-data parse is retained as an error field and does not silently claim the blob list is complete.

The reducer is still a data-state layer, not a live network session or a Phaser map renderer.


## Opcode 3 character extension state

`applyOpcode3Extension(state, packet)` stores the extension by the packet's character id only when the main identity/header group decoded completely. It retains neutral wire field names; no unverified business interpretation is introduced.

Each independently guarded group is applied only when its decoder success flag is true. A truncated optional group therefore cannot overwrite a previously known value with the decoder's sentinel defaults. The counted mapping is applied only when its count, pairs and UTF text all decode. The raw trailing bytes are copied.

This is an extension snapshot reducer only. It does not replace the primary opcode 3 character snapshot, and it does not infer whether the target id is the local player or another entity.


## Opcode 15 shop/context and pet-equipment image state

`applyOpcode15(state, packet)` stores accepted packets under `opcode15ByCharacterId[targetCharacterId]`.

- Subtype 0 updates only the `shopContext` variant: item records, the five short values, sentinel-guarded optional fields, and copied trailing bytes.
- Nonzero subtype updates only the `petEquipmentImage` variant: item records, frame count, atlas layout code, and a copied opaque image byte array.
- A later update of one variant preserves the other variant for the same character id.
- Rejected negative-count packets and packets without a valid target id are no-ops.

The reducer intentionally preserves wire field names and image bytes. It does not decode the atlas format, assign gameplay meaning to item fields, or claim that a purchase transaction succeeded.


## Unified initialization event reducer

`applyInitializationEvent(state, event)` is the explicit entry point for the implemented reducers.

- `S2C_OPCODE_1`: global catalogs/configuration.
- `S2C_OPCODE_3_SNAPSHOT`: fixed character snapshot prefix.
- `S2C_OPCODE_3_EXTENSION`: independently guarded extension groups.
- `S2C_OPCODE_15`: shop/context or pet-equipment image variant.
- `S2C_OPCODE_16`: currency/resource, inventory, auxiliary and counter updates.

Opcode 3 fixed-prefix snapshots and extension groups are merged under `charactersById[characterId]`, while retaining dedicated indexes. The event type distinguishes opcode 3's two decoders; it does not infer packet framing or automatically decode network bytes.

Unknown event types are no-ops. This layer remains disconnected from transport/socket and Phaser.


## Inbound initialization transport adapter

`applyInboundInitializationFrame(state, frameBytes, options)` now joins the verified S2C frame decoder to the initialization payload decoders and reducers.

- Decodes one complete S2C short/long frame using the existing transport codec.
- Dispatches only opcodes 1, 3, 15 and 16, whose payload decoder and state reducer are both implemented.
- Opcode 3 is decoded as the fixed prefix first; its remaining bytes are passed to the independently guarded extension decoder, then both events are merged by character ID.
- Returns the next receive cursor. For encrypted traffic the caller must carry this cursor into the next frame because the XOR stream continues across packet boundaries.
- Unknown/non-initialization opcodes are returned as unhandled without mutating state; malformed transport frames or strict payload decoders throw instead of silently mutating state.

This is a pure frame-to-state adapter. It does not open a TCP socket, negotiate a production key, buffer partial stream reads, connect to Phaser, or persist local state. The caller must provide one complete frame and maintain the receive key/cursor for a live stream.


## Incremental stream boundary

The frame-to-state adapter consumes complete frames. `ServerFrameStreamDecoder` now provides the preceding byte-stream layer: it buffers split TCP reads, emits coalesced complete frames, and preserves the encrypted receive cursor. It can pause after a caller-selected number of frames to allow the cleartext `-40` handshake to be handled and the receive key installed before buffered encrypted bytes are parsed. It remains a pure byte-stream utility, not a socket connection or Phaser integration.


## Stream-to-state composition

The intended pure client pipeline is now composable without re-encoding frames:

1. Feed each TCP read chunk to `ServerFrameStreamDecoder.push(chunk)`.
2. Pass each emitted decoded frame to `applyInboundInitializationPacket(state, frame)`.
3. Carry the stream decoder's receive key/cursor across chunks; the state adapter does not own transport state.

`applyInboundInitializationFrame` remains as a convenience for callers that already hold one complete raw frame. Neither entry point opens a socket or updates the Phaser demo automatically.
