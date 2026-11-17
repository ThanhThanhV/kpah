package com.kpah.server.world;

import java.util.List;

public record WorldMapGeometry(
        String mapId,
        double width,
        double height,
        double spawnX,
        double spawnY,
        List<CollisionBox> collisions
) {
    public WorldMapGeometry {
        if (mapId == null || mapId.isBlank()
                || !Double.isFinite(width) || !Double.isFinite(height)
                || width <= 0 || height <= 0
                || !Double.isFinite(spawnX) || !Double.isFinite(spawnY)
                || spawnX < 0 || spawnY < 0 || spawnX >= width || spawnY >= height) {
            throw new IllegalArgumentException("World map identity, dimensions and spawn are required.");
        }
        collisions = List.copyOf(collisions);
    }
}
