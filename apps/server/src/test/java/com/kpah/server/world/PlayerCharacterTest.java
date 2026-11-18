package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.Test;

class PlayerCharacterTest {
    @Test
    void createsPersistentSnapshotWithProgressAndInventory() {
        PlayerCharacter character = PlayerCharacter.from("character-1",
                new PlayerMotionState("starter-meadow", 120.5, 88.25, 4),
                73, 235, Map.of("green-slime-material", 3));

        assertEquals("character-1", character.getId());
        assertEquals("starter-meadow", character.getMapId());
        assertEquals(120.5, character.getX());
        assertEquals(88.25, character.getY());
        assertEquals(73, character.getHp());
        assertEquals(235, character.getExperience());
        assertEquals(3, character.getInventory().get("green-slime-material"));
    }

    @Test
    void clampsPersistedVitalsAndExperienceToNonNegativeValues() {
        PlayerCharacter character = PlayerCharacter.from("character-2",
                new PlayerMotionState("starter-meadow", 10, 20, 0),
                -5, -10, Map.of());

        assertEquals(0, character.getHp());
        assertEquals(0, character.getExperience());
    }
}
