package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class StarterWorldRegistry {
    private final Map<String, WorldMapGeometry> maps;

    public StarterWorldRegistry(TiledWorldMapLoader loader) {
        WorldMapGeometry starter = loader.load("maps/starter-meadow.json");
        this.maps = Map.of(starter.mapId(), starter);
    }

    public WorldMapGeometry require(String mapId) {
        WorldMapGeometry geometry = maps.get(mapId);
        if (geometry == null) throw new IllegalArgumentException("Unknown map: " + mapId);
        return geometry;
    }

    public java.util.Collection<WorldMapGeometry> all() {
        return maps.values();
    }
}
