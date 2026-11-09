# Server-selection and endpoint configuration trace

Verified from class `uj` and the connection builder in `km.b()`.

## Server selector

`uj` is a concrete screen state extending `tj`. Its static data contains nine default server entries. The labels are the original Vietnamese names as stored in the class constant pool (accent rendering in `javap` may vary with the host code page):

| Index | Server label | Default host | Port | Extra byte |
|---:|---|---|---:|---:|
| 0 | Vân Xuân (mới) | 112.213.84.163 | 19129 | 0 |
| 1 | Cổ Loa | 27.0.12.112 | 19130 | 0 |
| 2 | Thăng Long | 103.77.167.209 | 19129 | 0 |
| 3 | Hoa Lư | 103.77.167.209 | 19129 | 0 |
| 4 | Kinh Môn | 112.213.94.124 | 19129 | 0 |
| 5 | Hoàng Vương | 112.213.94.124 | 19129 | 3 |
| 6 | Mê Sơn | 112.213.94.124 | 19129 | 4 |
| 7 | Tràng An | 112.213.94.124 | 19129 | 1 |
| 8 | Tiên La | 112.213.94.124 | 19129 | 2 |

The parallel arrays are:

- `uj.g`: server display names.
- `uj.h`: host/IP strings.
- `uj.i`: TCP port values.
- `uj.j`: per-server byte values.

These are the built-in defaults. The constructor also reads the RMS record `ipnqsh`; if present, it replaces all four arrays by reading a count followed by each entry's UTF name, UTF host, short port, and byte value.

## Selected endpoint

- `uj.a` is the selected server index.
- The screen's input handler changes `uj.a` through the list.
- `km.b()` builds the actual connection string as `socket://` + `uj.h[uj.a]` + `:` + `uj.i[uj.a]`.
- For BlackBerry-style environments, the client may append a connection suffix such as `;interface=wifi` or `;deviceside=true`.
- The connection string is passed into `acv.a(String)`, which starts the socket connection worker.

The class also contains a separate fallback/test tuple (`Server test`, `27.0.12.112`, port `19150`). Do not confuse that tuple with the nine-entry default selector arrays: `km.b()` uses the selected `h/i` array entries.

## Persistence and backend implications

The server list is client-configurable and persisted locally under `ipnqsh`; it is not a hardcoded single endpoint. A Web recreation should model server selection as data, and the backend should support an explicit environment/server configuration rather than silently choosing one of these historical IPs.

The addresses above are literal defaults embedded in the supplied JAR, not a claim that those servers are currently reachable or authorized for use.
