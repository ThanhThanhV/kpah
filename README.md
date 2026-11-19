# 2D MMORPG (Greenfield)

A greenfield, top-down 2D MMORPG prototype. The project uses original code and original placeholder visuals; it does not bundle or depend on source code, art, audio, or assets from another game.

## Current vertical slice

- `apps/client`: TypeScript + Phaser browser client with a procedural debug character, typed starter-map definition, row-major ground renderer, collision geometry, four-direction facing, free movement and normalized diagonals.
- `apps/server`: Java 21 + Spring Boot game server backed by MySQL.
- `infra/load`: opt-in k6 scenarios for WebSocket gateway load testing.
- `docs`: architecture decisions and WBS progress evidence.

## Run locally

Requirements: Node.js 22+, npm 10+, JDK 21+, Maven 3.9+ and a local MySQL 8.x server listening on port 3306.

```bash
cd apps/client
npm install
npm run dev
```

Create the local MySQL database once (the application user must have privileges to create/update tables):

```sql
CREATE DATABASE mmorpg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

The default local connection is `jdbc:mysql://localhost:3306/mmorpg`, user `root`, password `123456`. Override credentials with `DB_USERNAME` and `DB_PASSWORD`, or override the full JDBC URL with `DATABASE_URL`.

Start the server:

```bash
cd apps/server
mvn spring-boot:run
```

Client: http://localhost:5173  
Server health: http://localhost:8080/api/health  
Account API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/logout-all`

## Controls

- WASD or arrow keys: move freely in 8-way vector space.
- Facing: four directions; dominant axis wins, exact diagonal ties preserve the last facing.
- Space: temporary attack pose; Shift: cast pose.
- Map bounds and collision rectangles are tested on the client for responsiveness. The Java MovementService is authoritative. EXP, HP, map position, inventory and equipment are persisted in MySQL.
- Register or sign in with an email and a password of at least 10 characters. Passwords are stored as PBKDF2-HMAC-SHA256 hashes with per-password random salts. Sessions use random opaque tokens; only SHA-256 token hashes are stored in MySQL and sessions expire after 30 days.
- Each account receives one starter character and can create up to two additional characters (maximum three). Character selection is saved in the authenticated session; classes are Warrior, Mage and Archer with server-authoritative base HP, attack and defense bonuses. WebSocket connections require a valid session token and the server verifies the character belongs to the authenticated account. The browser stores the opaque session token and character ID in local storage; protect the client against XSS and deploy only behind HTTPS/WSS. The WebSocket sends the token in a custom `Sec-WebSocket-Protocol` value rather than the URL. Public deployments must use WSS and avoid logging handshake credentials.

## Character art pipeline

See [character asset integration contract](docs/art/CHARACTER_ASSET_PIPELINE.md) for the exact spritesheet/Spine hand-off format and acceptance checklist.

## Project status

See [WBS progress](docs/progress/WBS_PROGRESS.md). The progress report distinguishes code committed from builds/tests actually executed. No local build is claimed by a GitHub-only commit.


## WebSocket load testing

See [the k6 world gateway load-test guide](infra/load/README.md). Use disposable test accounts and a dedicated MySQL test database; never commit session tokens or point the scenario at production without an approved test window.
