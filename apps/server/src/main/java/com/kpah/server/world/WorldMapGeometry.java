package com.kpah.server.world;

import java.util.List;

public record WorldMapGeometry(
        String mapId,
        double width,
        double height,
        List<CollisionBox> collisions
) {
    public WorldMapGeometry {
        if (mapId == null || mapId.isBlank()
                || !Double.isFinite(width) || !Double.isFinite(height)
                || width <= 0 || height <= 0) {
            throw new IllegalArgumentException("World map identity and dimensions are required.");
        }
        collisions = List.copyOf(collisions);
    }
}
