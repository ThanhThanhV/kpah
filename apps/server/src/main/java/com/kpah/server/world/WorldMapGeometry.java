package com.kpah.server.world;

import java.util.List;

public record WorldMapGeometry(
        String mapId,
        double width,
        double height,
        double spawnX,
        double spawnY,
        List<CollisionBox> collisions,
        List<MonsterSpawnRegion> monsterSpawns,
        List<NpcDefinition> npcs,
        List<PortalDefinition> portals
) {
    public WorldMapGeometry(String mapId, double width, double height, double spawnX, double spawnY,
                            List<CollisionBox> collisions, List<MonsterSpawnRegion> monsterSpawns,
                            List<NpcDefinition> npcs) {
        this(mapId, width, height, spawnX, spawnY, collisions, monsterSpawns, npcs, List.of());
    }

    public WorldMapGeometry(String mapId, double width, double height, double spawnX, double spawnY,
                            List<CollisionBox> collisions, List<MonsterSpawnRegion> monsterSpawns) {
        this(mapId, width, height, spawnX, spawnY, collisions, monsterSpawns, List.of(), List.of());
    }

    public WorldMapGeometry {
        if (mapId == null || mapId.isBlank()
                || !Double.isFinite(width) || !Double.isFinite(height)
                || width <= 0 || height <= 0
                || !Double.isFinite(spawnX) || !Double.isFinite(spawnY)
                || spawnX < 0 || spawnY < 0 || spawnX >= width || spawnY >= height) {
            throw new IllegalArgumentException("World map identity, dimensions and spawn are required.");
        }
        collisions = List.copyOf(collisions);
        monsterSpawns = List.copyOf(monsterSpawns);
        npcs = List.copyOf(npcs);
        portals = List.copyOf(portals);
    }
}
