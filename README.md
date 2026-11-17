# 2D MMORPG (Greenfield)

A greenfield, top-down 2D MMORPG prototype. The project uses original code and original placeholder visuals; it does not bundle or depend on source code, art, audio, or assets from another game.

## Current vertical slice

- `apps/client`: TypeScript + Phaser browser client with a procedural debug character, typed starter-map definition, row-major ground renderer, collision geometry, four-direction facing, free movement and normalized diagonals.
- `apps/server`: Java 21 + Spring Boot API skeleton, health endpoint and server-side movement rules for the starter map.
- `infra`: local PostgreSQL service for the persistence phase.
- `docs`: architecture decisions and WBS progress evidence.

## Run locally

Requirements: Node.js 22+, npm 10+, JDK 21+, Maven 3.9+ and Docker (optional, for PostgreSQL).

```bash
cd apps/client
npm install
npm run dev
```

In another terminal:

```bash
cd apps/server
mvn spring-boot:run
```

Client: http://localhost:5173  
Server health: http://localhost:8080/api/health

Start local PostgreSQL when needed:

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Controls

- WASD or arrow keys: move freely in 8-way vector space.
- Facing: four directions; dominant axis wins, exact diagonal ties preserve the last facing.
- Space: temporary attack pose; Shift: cast pose.
- Map bounds and collision rectangles are tested on the client for responsiveness. The Java MovementService is the authoritative movement calculation; realtime WebSocket wiring is the next step.

## Project status

See [WBS progress](docs/progress/WBS_PROGRESS.md). The progress report distinguishes code committed from builds/tests actually executed. No local build is claimed by a GitHub-only commit.
