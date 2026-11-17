package com.kpah.server.world;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Loads the same Tiled JSON map served to the Phaser client. The client public
 * directory is also packaged as a server resource by the Maven build.
 */
@Component
public class TiledWorldMapLoader {
    private final ObjectMapper mapper;

    public TiledWorldMapLoader(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public WorldMapGeometry load(String resourcePath) {
        try (InputStream stream = new ClassPathResource(resourcePath).getInputStream()) {
            JsonNode root = mapper.readTree(stream);
            if (!"map".equals(root.path("type").asText())
                    || !"orthogonal".equals(root.path("orientation").asText())
                    || root.path("infinite").asBoolean(true)) {
                throw new IllegalStateException("Only finite orthogonal Tiled maps are supported: " + resourcePath);
            }

            double width = root.path("width").asDouble() * root.path("tilewidth").asDouble();
            double height = root.path("height").asDouble() * root.path("tileheight").asDouble();
            String mapId = property(root.path("properties"), "mapId");
            if (mapId == null || mapId.isBlank() || width <= 0 || height <= 0) {
                throw new IllegalStateException("Tiled map metadata or dimensions are invalid: " + resourcePath);
            }

            double spawnX = root.path("tilewidth").asDouble();
            double spawnY = root.path("tileheight").asDouble();
            List<CollisionBox> collisions = new ArrayList<>();
            for (JsonNode layer : root.path("layers")) {
                if (!"objectgroup".equals(layer.path("type").asText())
                        || !layer.path("visible").asBoolean(true)) {
                    continue;
                }
                for (JsonNode object : layer.path("objects")) {
                    if (!object.path("visible").asBoolean(true)) continue;
                    String objectClass = object.path("class").asText(object.path("type").asText());
                    if ("spawn".equals(objectClass)) {
                        spawnX = object.path("x").asDouble(Double.NaN);
                        spawnY = object.path("y").asDouble(Double.NaN);
                    } else if ("collision".equals(objectClass)) {
                        collisions.add(new CollisionBox(
                                object.path("x").asDouble(Double.NaN),
                                object.path("y").asDouble(Double.NaN),
                                object.path("width").asDouble(Double.NaN),
                                object.path("height").asDouble(Double.NaN)
                        ));
                    }
                }
            }
            return new WorldMapGeometry(mapId, width, height, spawnX, spawnY, collisions);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load Tiled world map: " + resourcePath, exception);
        }
    }

    private String property(JsonNode properties, String name) {
        for (JsonNode property : properties) {
            if (name.equals(property.path("name").asText())) {
                return property.path("value").asText();
            }
        }
        return null;
    }
}
