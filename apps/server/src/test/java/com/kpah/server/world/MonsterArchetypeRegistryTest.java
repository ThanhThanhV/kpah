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
                "broken", "Broken", 0, 1, 20, 10, 500, 1));
    }
}
