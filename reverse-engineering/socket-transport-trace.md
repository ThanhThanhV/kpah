# Socket transport and packet framing

Verified from `acv`, `acy`, `acz`, and `acu` bytecode in KPAH 2.7.8.

## Connection lifecycle

- `acv` implements the outgoing packet interface `act`.
- `acv.a(String)` starts a connection worker (`acy`) with a supplied connection string. The host/port/URL is therefore provided by another part of the client; it is not hardcoded in this method.
- `acy.run()` opens that string through `Connector.open`, casts the result to `SocketConnection`, and opens a `DataOutputStream` and `DataInputStream`.
- It starts the queued-packet writer (`acz`), the inbound reader worker, and a further connection-maintenance worker.
- After the streams and workers are ready, it sends an initialization packet with opcode byte **-40**, then calls the registered connection callback.
- The writer queue stores `acu` packet objects and forwards them to `acv` while the connection is active.

## Packet structure

`acu` is the packet builder:

- Its constructor stores the opcode byte.
- Its `DataOutputStream` accumulates the packet body.
- `acu.a()` exposes the accumulated body bytes.

The synchronized writer in `acv` serializes each packet as:

1. One opcode byte.
2. A two-byte payload length.
3. The payload bytes.
4. A stream flush.

When `acv.g` is false, opcode and length are written directly. When `acv.g` is true, the opcode, both length bytes, and each payload byte are XOR-transformed using the current byte from the connection key array `acv.h`; the key index advances as bytes are transformed.

This is the observed outbound framing. The inbound reader must be inspected separately before assuming that it uses precisely the same framing or key progression.

## Login handshake relationship

The login worker `rq` calls `jy.e()` before sending the login request. `jy.e()` constructs a packet with opcode **-1** and writes a single byte value **2** into its payload. The actual login packet then follows with opcode **1**.

The socket connection worker independently sends opcode **-40** after opening the socket. Do not conflate these two packets: one is emitted during socket setup, the other by the login flow.

## Current reconstruction implications

A compatible backend will need to reproduce the packet envelope and the connection handshake in addition to implementing the application opcodes. However, do not hardcode a server address or invent an encryption key: the endpoint source, inbound framing, key negotiation, and encryption activation path remain to be traced.
