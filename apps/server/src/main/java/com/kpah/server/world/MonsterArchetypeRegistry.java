package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MonsterArchetypeRegistry {
    private final Map<String, MonsterArchetype> archetypes = Map.of(
            "green-slime", new MonsterArchetype(
                    "green-slime", "Green Slime", 60, 8, 30.0, 150.0, 1_100L, 1.0),
            "forest-wolf", new MonsterArchetype(
                    "forest-wolf", "Forest Wolf", 110, 14, 34.0, 190.0, 900L, 1.55)
    );

    public MonsterArchetype require(String monsterType) {
        MonsterArchetype archetype = archetypes.get(monsterType);
        if (archetype == null) {
            throw new IllegalArgumentException("Unknown monster archetype: " + monsterType);
        }
        return archetype;
    }

    public Map<String, MonsterArchetype> all() {
        return archetypes;
    }
}
