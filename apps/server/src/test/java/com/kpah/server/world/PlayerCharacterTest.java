package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Map;
import org.junit.jupiter.api.Test;

class PlayerCharacterTest {
    @Test
    void createsPersistentSnapshotWithProgressAndInventory() {
        PlayerCharacter character = PlayerCharacter.from("character-1",
                new PlayerMotionState("starter-meadow", 120.5, 88.25, 4),
                73, 235, Map.of("green-slime-material", 3), Map.of("weapon", "novice-sword"));

        assertEquals("character-1", character.getId());
        assertEquals("starter-meadow", character.getMapId());
        assertEquals(120.5, character.getX());
        assertEquals(88.25, character.getY());
        assertEquals(73, character.getHp());
        assertEquals(235, character.getExperience());
        assertEquals(3, character.getInventory().get("green-slime-material"));
        assertEquals("novice-sword", character.getEquipment().get("weapon"));
    }

    @Test
    void bindsCharacterToOwningAccount() {
        PlayerCharacter character = PlayerCharacter.from("account-1", "character-1",
                new PlayerMotionState("starter-meadow", 10, 20, 0),
                100, 0, Map.of(), Map.of());

        assertEquals("account-1", character.getAccountId());
    }

    @Test
    void clampsPersistedVitalsAndExperienceToNonNegativeValues() {
        PlayerCharacter character = PlayerCharacter.from("character-2",
                new PlayerMotionState("starter-meadow", 10, 20, 0),
                -5, -10, Map.of());

        assertEquals(0, character.getHp());
        assertEquals(0, character.getExperience());
        assertEquals(Map.of(), character.getEquipment());
    }
}
