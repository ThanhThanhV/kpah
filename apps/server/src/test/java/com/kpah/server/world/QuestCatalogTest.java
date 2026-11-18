package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class QuestCatalogTest {
    private final QuestCatalog catalog = new QuestCatalog();

    @Test
    void bindsMeadowGuideToConfiguredSlimeHunt() {
        QuestCatalog.QuestDefinition definition = catalog.findByNpcId("6");

        assertEquals("meadow-slime-hunt", definition.questId());
        assertEquals("green-slime", definition.targetMonsterType());
        assertEquals(3, definition.requiredKills());
        assertEquals(100, definition.experienceReward());
    }

    @Test
    void unknownNpcDoesNotStartAQuest() {
        assertNull(catalog.findByNpcId("unknown"));
    }
}
