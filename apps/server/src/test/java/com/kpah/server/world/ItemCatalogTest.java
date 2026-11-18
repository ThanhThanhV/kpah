package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ItemCatalogTest {
    private final ItemCatalog catalog = new ItemCatalog();

    @Test
    void sumsOnlyBonusesFromMatchingEquippedSlots() {
        Map<String, String> equipment = Map.of(
                "weapon", "novice-sword",
                "body", "cloth-tunic",
                "ring", "novice-sword");

        assertEquals(5, catalog.attackBonus(equipment));
        assertEquals(3, catalog.defenseBonus(equipment));
    }

    @Test
    void defenseReducesIncomingDamageButNeverMakesAHitDealZero() {
        assertEquals(5, ItemCatalog.mitigateDamage(8, 3));
        assertEquals(1, ItemCatalog.mitigateDamage(8, 20));
        assertEquals(0, ItemCatalog.mitigateDamage(0, 20));
    }
}
