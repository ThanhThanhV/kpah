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
    @Test
    void inventoryRespectsItemStackLimitsAndReturnsAcceptedAmount() {
        ItemCatalog.InventoryUpdate update = catalog.addToInventory(
                Map.of(), "green-slime-material", 120);

        assertEquals(99, update.acceptedAmount());
        assertEquals(99, update.inventory().get("green-slime-material"));
        ItemCatalog.InventoryUpdate fullStack = catalog.addToInventory(
                update.inventory(), "green-slime-material", 1);
        assertEquals(0, fullStack.acceptedAmount());
    }

    @Test
    void inventoryRejectsNewItemsWhenAllTwentySlotsAreOccupied() {
        Map<String, Integer> fullBag = new java.util.HashMap<>();
        for (int i = 0; i < 20; i++) fullBag.put("other-item-" + i, 1);

        ItemCatalog.InventoryUpdate update = catalog.addToInventory(
                fullBag, "green-slime-material", 1);

        assertEquals(0, update.acceptedAmount());
        assertEquals(20, update.inventory().size());
    }

}
