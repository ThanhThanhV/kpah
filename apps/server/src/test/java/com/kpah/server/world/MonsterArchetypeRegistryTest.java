package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class MonsterArchetypeRegistryTest {
    private final MonsterArchetypeRegistry registry = new MonsterArchetypeRegistry();

    @Test
    void exposesDistinctSlimeAndWolfCombatProfiles() {
        MonsterArchetype slime = registry.require("green-slime");
        MonsterArchetype wolf = registry.require("forest-wolf");

        assertEquals(60, slime.maxHp());
        assertEquals(8, slime.attackDamage());
        assertEquals(110, wolf.maxHp());
        assertEquals(14, wolf.attackDamage());
        assertEquals(MonsterBehavior.DEFENSIVE, slime.behavior());
        assertEquals(MonsterBehavior.AGGRESSIVE, wolf.behavior());
        assertEquals(MonsterBehavior.PATROL, registry.require("forest-sentinel").behavior());
        assertEquals(MonsterBehavior.ELITE, registry.require("alpha-wolf").behavior());
        org.junit.jupiter.api.Assertions.assertTrue(wolf.moveSpeedMultiplier() > slime.moveSpeedMultiplier());
        org.junit.jupiter.api.Assertions.assertTrue(wolf.aggroRange() > slime.aggroRange());
    }

    @Test
    void rejectsUnknownMonsterTypes() {
        assertThrows(IllegalArgumentException.class, () -> registry.require("unknown-beast"));
    }

    @Test
    void rejectsInvalidArchetypeStats() {
        assertThrows(IllegalArgumentException.class, () -> new MonsterArchetype(
                "broken", "Broken", 0, 1, 20, 20, 500, 1, MonsterBehavior.DEFENSIVE));
    }
}
