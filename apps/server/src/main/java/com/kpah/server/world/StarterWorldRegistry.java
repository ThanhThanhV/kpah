package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class StarterWorldRegistry {
    private final Map<String, WorldMapGeometry> maps;

    public StarterWorldRegistry(TiledWorldMapLoader loader) {
        java.util.Map<String, WorldMapGeometry> registered = new java.util.LinkedHashMap<>();
        for (WorldMapGeometry map : loader.loadAll("maps/index.json")) {
            registered.put(map.mapId(), map);
        }
        this.maps = Map.copyOf(registered);
        for (WorldMapGeometry map : this.maps.values()) {
            for (PortalDefinition portal : map.portals()) {
                WorldMapGeometry destination = this.maps.get(portal.targetMapId());
                if (destination == null
                        || portal.targetX() < 0 || portal.targetY() < 0
                        || portal.targetX() >= destination.width()
                        || portal.targetY() >= destination.height()) {
                    throw new IllegalStateException("Invalid portal destination " + portal.id()
                            + " from map " + map.mapId() + " to " + portal.targetMapId());
                }
            }
        }
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
