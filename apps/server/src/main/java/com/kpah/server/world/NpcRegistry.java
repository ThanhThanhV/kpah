package com.kpah.server.world;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class NpcRegistry {
    private final StarterWorldRegistry worlds;
    private final Map<String, Map<String, NpcDefinition>> maps = new ConcurrentHashMap<>();

    public NpcRegistry(StarterWorldRegistry worlds) {
        this.worlds = worlds;
    }

    public NpcDefinition require(String mapId, String npcId) {
        if (mapId == null || npcId == null) {
            throw new IllegalArgumentException("Map and NPC IDs are required.");
        }
        Map<String, NpcDefinition> npcs = maps.computeIfAbsent(mapId, id ->
                worlds.require(id).npcs().stream().collect(Collectors.toUnmodifiableMap(
                        NpcDefinition::id, Function.identity())));
        NpcDefinition npc = npcs.get(npcId);
        if (npc == null) throw new IllegalArgumentException("NPC not found on this map.");
        return npc;
    }
}
