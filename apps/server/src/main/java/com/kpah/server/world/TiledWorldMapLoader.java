package com.kpah.server.world;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class TiledWorldMapLoader {
    private final ObjectMapper mapper;

    public TiledWorldMapLoader(ObjectMapper mapper) { this.mapper = mapper; }

    public WorldMapGeometry load(String resourcePath) {
        try (InputStream stream = new ClassPathResource(resourcePath).getInputStream()) {
            JsonNode root = mapper.readTree(stream);
            if (!"map".equals(root.path("type").asText())
                    || !"orthogonal".equals(root.path("orientation").asText())
                    || root.path("infinite").asBoolean(true)) {
                throw new IllegalStateException("Only finite orthogonal Tiled maps are supported: " + resourcePath);
            }
            double tileWidth = root.path("tilewidth").asDouble();
            double tileHeight = root.path("tileheight").asDouble();
            double width = root.path("width").asDouble() * tileWidth;
            double height = root.path("height").asDouble() * tileHeight;
            String mapId = property(root.path("properties"), "mapId");
            if (mapId == null || mapId.isBlank() || width <= 0 || height <= 0) {
                throw new IllegalStateException("Tiled map metadata or dimensions are invalid: " + resourcePath);
            }

            double spawnX = tileWidth;
            double spawnY = tileHeight;
            List<CollisionBox> collisions = new ArrayList<>();
            List<MonsterSpawnRegion> monsterSpawns = new ArrayList<>();
            List<NpcDefinition> npcs = new ArrayList<>();
            for (JsonNode layer : root.path("layers")) {
                if (!"objectgroup".equals(layer.path("type").asText())
                        || !layer.path("visible").asBoolean(true)) continue;
                for (JsonNode object : layer.path("objects")) {
                    if (!object.path("visible").asBoolean(true)) continue;
                    String objectClass = object.path("class").asText(object.path("type").asText());
                    double x = object.path("x").asDouble(Double.NaN);
                    double y = object.path("y").asDouble(Double.NaN);
                    double objectWidth = object.path("width").asDouble(0);
                    double objectHeight = object.path("height").asDouble(0);
                    if ("spawn".equals(objectClass)) {
                        spawnX = x;
                        spawnY = y;
                    } else if ("collision".equals(objectClass)) {
                        collisions.add(new CollisionBox(x, y, objectWidth, objectHeight));
                    } else if ("npc".equals(objectClass)) {
                        String npcId = object.path("id").asText();
                        String npcName = object.path("name").asText("Villager");
                        npcs.add(new NpcDefinition(npcId, npcName, x, y, objectWidth, objectHeight));
                    } else if ("monster-spawn".equals(objectClass)) {
                        String regionId = object.path("id").asText();
                        String monsterType = property(object.path("properties"), "monsterType");
                        if (monsterType == null || monsterType.isBlank()) monsterType = "green-slime";
                        int maxAlive = intProperty(object.path("properties"), "maxAlive", 4);
                        long respawnMillis = longProperty(object.path("properties"), "respawnMillis", 5000);
                        double roamRadius = doubleProperty(object.path("properties"), "roamRadius", 48);
                        double moveSpeed = doubleProperty(object.path("properties"), "moveSpeed", 24);
                        monsterSpawns.add(new MonsterSpawnRegion(regionId, monsterType, x, y,
                                objectWidth, objectHeight, maxAlive, respawnMillis, roamRadius, moveSpeed));
                    }
                }
            }
            return new WorldMapGeometry(mapId, width, height, spawnX, spawnY, collisions, monsterSpawns, npcs);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load Tiled world map: " + resourcePath, exception);
        }
    }

    private String property(JsonNode properties, String name) {
        for (JsonNode property : properties) {
            if (name.equals(property.path("name").asText())) return property.path("value").asText();
        }
        return null;
    }

    private int intProperty(JsonNode properties, String name, int fallback) {
        for (JsonNode property : properties) if (name.equals(property.path("name").asText())) {
            return property.path("value").asInt(fallback);
        }
        return fallback;
    }

    private long longProperty(JsonNode properties, String name, long fallback) {
        for (JsonNode property : properties) if (name.equals(property.path("name").asText())) {
            return property.path("value").asLong(fallback);
        }
        return fallback;
    }

    private double doubleProperty(JsonNode properties, String name, double fallback) {
        for (JsonNode property : properties) if (name.equals(property.path("name").asText())) {
            return property.path("value").asDouble(fallback);
        }
        return fallback;
    }
}
