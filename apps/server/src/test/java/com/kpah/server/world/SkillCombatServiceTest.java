package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SkillCombatServiceTest {
    private MonsterSimulationService monsters;
    private SkillCombatService combat;
    private PlayerMotionState caster;

    @BeforeEach
    void setUp() {
        monsters = mock(MonsterSimulationService.class);
        combat = new SkillCombatService(new SkillCatalog(), monsters);
        caster = new PlayerMotionState("starter-meadow", 40, 50, 0);
        MonsterState target = new MonsterState("slime-1", "green-slime", "starter-meadow",
                "spawn-1", 80, 50, 80, 50, 20, 60, "idle");
        when(monsters.applySkillAttack("starter-meadow", 40, 50, "slime-1",
                45, 110.0, 1_000L))
                .thenReturn(new MonsterAttackResult(true, "Hit", target, 40));
        when(monsters.applySkillAttack("starter-meadow", 40, 50, "slime-1",
                30, 180.0, 1_000L))
                .thenReturn(new MonsterAttackResult(true, "Hit", target, 25));
    }

    @Test
    void acceptsClassSkillAndStartsItsCooldownAndManaCost() {
        SkillCastResult result = combat.cast("player-1", "warrior", caster,
                "warrior-power-strike", "slime-1", 5, 1, 1_000L);
        assertTrue(result.accepted());
        assertEquals(70, result.manaRemaining());
        assertFalse(combat.cast("player-1", "warrior", caster,
                "warrior-power-strike", "slime-1", 5, 1, 1_500L).accepted());
    }

    @Test
    void supportsIndependentClassSkillKits() {
        assertTrue(combat.cast("warrior-1", "warrior", caster,
                "warrior-power-strike", "slime-1", 5, 1, 1_000L).accepted());
        assertTrue(combat.cast("mage-1", "mage", caster,
                "mage-arcane-bolt", "slime-1", 5, 1, 1_000L).accepted());
        assertEquals(2, combat.skillsFor("archer").size());
    }

    @Test
    void unlocksSecondClassSkillAtLevelThree() {
        assertEquals(1, combat.skillsFor("warrior", 1).size());
        assertEquals(2, combat.skillsFor("warrior", 3).size());
        SkillCastResult locked = combat.cast("player-1", "warrior", caster,
                "warrior-shield-break", "slime-1", 5, 1, 1_000L);
        assertFalse(locked.accepted());
        assertTrue(locked.message().contains("Requires level 3"));
    }

    @Test
    void rejectsSkillsFromAnotherClass() {
        SkillCastResult result = combat.cast("player-1", "warrior", caster,
                "mage-arcane-bolt", "slime-1", 5, 1, 1_000L);
        assertFalse(result.accepted());
        assertEquals(100, result.manaRemaining());
    }

    @Test
    void restoresPersistedManaAndClampsItToLevelMaximum() {
        combat.restore("player-1", "warrior", 1, 47, 1_000L);
        assertEquals(47, combat.manaFor("player-1", "warrior", 1, 1_000L));
        assertEquals(55, combat.manaFor("player-1", "warrior", 1, 2_000L));

        combat.restore("mage-1", "mage", 1, 999, 1_000L);
        assertEquals(140, combat.manaFor("mage-1", "mage", 1, 1_000L));
    }

    @Test
    void regeneratesManaOverTime() {
        combat.cast("player-1", "warrior", caster,
                "warrior-power-strike", "slime-1", 5, 1, 1_000L);
        assertEquals(78, combat.manaFor("player-1", "warrior", 1, 2_000L));
    }
}
