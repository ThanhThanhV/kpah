package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ExperienceProgressionTest {
    @Test
    void startsAtLevelOne() {
        assertEquals(1, ExperienceProgression.levelFor(0));
        assertEquals(100, ExperienceProgression.experienceToNextLevel(0));
    }

    @Test
    void advancesEveryHundredExperience() {
        assertEquals(1, ExperienceProgression.levelFor(99));
        assertEquals(2, ExperienceProgression.levelFor(100));
        assertEquals(3, ExperienceProgression.levelFor(200));
        assertEquals(35, ExperienceProgression.experienceIntoLevel(235));
        assertEquals(65, ExperienceProgression.experienceToNextLevel(235));
    }
}
