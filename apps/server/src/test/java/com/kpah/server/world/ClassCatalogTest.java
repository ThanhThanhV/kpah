package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class ClassCatalogTest {
    private final ClassCatalog catalog = new ClassCatalog();

    @Test
    void definesDistinctBaseStatsForEveryStarterClass() {
        assertEquals(120, catalog.maxHp("warrior"));
        assertEquals(3, catalog.attackBonus("warrior"));
        assertEquals(2, catalog.defenseBonus("warrior"));

        assertEquals(90, catalog.maxHp("mage"));
        assertEquals(8, catalog.attackBonus("mage"));
        assertEquals(0, catalog.defenseBonus("mage"));

        assertEquals(100, catalog.maxHp("archer"));
        assertEquals(5, catalog.attackBonus("archer"));
        assertEquals(1, catalog.defenseBonus("archer"));
    }

    @Test
    void rejectsUnknownClassCodes() {
        assertThrows(IllegalArgumentException.class, () -> catalog.maxHp("paladin"));
    }
}
