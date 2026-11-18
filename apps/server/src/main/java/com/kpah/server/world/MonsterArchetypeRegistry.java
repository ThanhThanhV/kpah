package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MonsterArchetypeRegistry {
    private final Map<String, MonsterArchetype> archetypes = Map.of(
            "green-slime", new MonsterArchetype(
                    "green-slime", "Green Slime", 60, 8, 30.0, 150.0, 1_100L, 1.0,
                    MonsterBehavior.DEFENSIVE),
            "forest-wolf", new MonsterArchetype(
                    "forest-wolf", "Forest Wolf", 110, 14, 34.0, 190.0, 900L, 1.55,
                    MonsterBehavior.AGGRESSIVE),
            "forest-sentinel", new MonsterArchetype(
                    "forest-sentinel", "Forest Sentinel", 180, 12, 30.0, 30.0, 1_300L, 0.75,
                    MonsterBehavior.PATROL),
            "alpha-wolf", new MonsterArchetype(
                    "alpha-wolf", "Alpha Wolf", 260, 22, 42.0, 240.0, 850L, 1.7,
                    MonsterBehavior.ELITE),
            "ancient-guardian", new MonsterArchetype(
                    "ancient-guardian", "Ancient Guardian", 520, 28, 46.0, 260.0, 1_150L, 0.7,
                    MonsterBehavior.ELITE, MonsterSpecialAttack.SWEEP)
    );

    public MonsterArchetype require(String monsterType) {
        MonsterArchetype archetype = archetypes.get(monsterType);
        if (archetype == null) throw new IllegalArgumentException("Unknown monster archetype: " + monsterType);
        return archetype;
    }

    public Map<String, MonsterArchetype> all() { return archetypes; }
}
