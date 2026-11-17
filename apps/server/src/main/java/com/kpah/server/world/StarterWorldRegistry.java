package com.kpah.server.world;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class StarterWorldRegistry {
    private final Map<String, WorldMapGeometry> maps = Map.of(
        "starter-meadow",
        new WorldMapGeometry(
            "starter-meadow",
            1280,
            704,
            List.of(
                new CollisionBox(256, 192, 128, 32),
                new CollisionBox(864, 384, 160, 32),
                new CollisionBox(160, 480, 64, 96),
                new CollisionBox(1088, 160, 32, 128)
            )
        )
    );

    public WorldMapGeometry require(String mapId) {
        WorldMapGeometry geometry = maps.get(mapId);
        if (geometry == null) {
            throw new IllegalArgumentException("Unknown map: " + mapId);
        }
        return geometry;
    }
}
