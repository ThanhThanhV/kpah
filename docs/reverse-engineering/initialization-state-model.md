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
