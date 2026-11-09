# Authentication request trace

This note records only the client-side request construction observed in the KPAH 2.7.8 bytecode. It does not infer server response formats or claim the original server is available.

## Login action

1. The login button in screen class `ro` is wired to callback `rp`.
2. `rp.a()` reads the Game ID from `ro.a`, lowercases and trims it; it reads the password from `ro.g`.
3. If either value is missing, the callback changes focus to the relevant input rather than sending a request.
4. Otherwise it starts worker `rq` and shows the message `Đang kết nối`.
5. `rq.run()` waits 500 ms, calls `km.b()`, calls `jy.e()`, then calls `jy.a(gameId, password, GameMidlet.c)`. It subsequently clears `mj.ay`.

## Login packet construction

The method `jy.a(String, String, String)` creates a packet using message/opcode byte **1**. The bytecode writes these values in order to a `DataOutputStream`:

1. Game ID (UTF)
2. Password (UTF)
3. Client version argument (UTF; caller passes `game.GameMidlet.c`, which is `2.7.8`)
4. `microedition.platform` system property (UTF)
5. `game.GameMidlet.d` (UTF)
6. `game.GameMidlet.e` (UTF)
7. `game.GameMidlet.f` (UTF)
8. A zero byte
9. Current Canvas width `km.m` (short)
10. A device/platform flag byte (`-1` when `km.b` is true, otherwise `0`)
11. A byte selected from the `uj.j` device/configuration array using `uj.a` (with a bounds fallback to zero)

The packet is handed to the transport interface `act.a(acu)`, then closed/flushed through `acu.d()`. The transport implementation and server-side interpretation still need to be traced.

## Registration action

The registration control in `ro` is wired to callback `rv`.

- It validates that Game ID and password are present.
- It asks the user to confirm registration for the entered Game ID.
- On confirmation, callback `rs` checks the connection state and invokes `jy.a(gameId, password)`.
- `jy.a(String, String)` constructs a packet using opcode byte **39** and writes Game ID, password, `game.GameMidlet.d`, `game.GameMidlet.e`, and `game.GameMidlet.f` as UTF strings before passing it to `act.a(acu)`.

The separate callback `ru` toggles the saved-credential state on the login screen; it is not the network registration action.

## What is not established yet

- The server response format for opcode 1 or 39.
- The precise meaning of the three additional MIDlet strings `d/e/f`.
- The endpoint, encryption, framing, and reconnect behavior inside the transport implementation.
- The screen transition after successful authentication and the exact character-list response.

Those details must be traced from `act`, `acu`, the connection implementation, and the inbound message dispatcher before defining a compatible backend.
