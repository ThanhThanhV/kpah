package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class QuestCatalogTest {
    private final QuestCatalog catalog = new QuestCatalog();

    @Test
    void bindsMeadowGuideToConfiguredSlimeHunt() {
        QuestCatalog.QuestDefinition definition = catalog.findByNpcId("6").getFirst();

        assertEquals("meadow-slime-hunt", definition.questId());
        assertEquals("starter-meadow", definition.targetMapId());
        assertEquals("green-slime", definition.targetMonsterType());
        assertEquals(3, definition.requiredKills());
        assertEquals(100, definition.experienceReward());
    }

    @Test
    void forestWardenOffersWolfHuntAfterForestSlimeQuest() {
        var quests = catalog.findByNpcId("105");
        assertEquals(2, quests.size());
        assertEquals("forest-slime-hunt", quests.get(0).questId());
        assertEquals("forest-wolf-hunt", quests.get(1).questId());
        assertEquals("forest-wolf", quests.get(1).targetMonsterType());
        assertEquals(3, quests.get(1).requiredKills());
        assertEquals(350, quests.get(1).experienceReward());
    }

    @Test
    void unknownNpcDoesNotStartAQuest() {
        assertEquals(0, catalog.findByNpcId("unknown").size());
    }
}
