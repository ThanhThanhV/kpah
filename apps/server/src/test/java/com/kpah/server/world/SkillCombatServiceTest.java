package com.kpah.server.world;

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
                40, 110.0, 1_000L))
                .thenReturn(new MonsterAttackResult(true, "Hit", target, 40));
        when(monsters.applySkillAttack("starter-meadow", 40, 50, "slime-1",
                25, 180.0, 1_000L))
                .thenReturn(new MonsterAttackResult(true, "Hit", target, 25));
    }

    @Test
    void acceptsKnownSkillAndStartsItsCooldown() {
        assertTrue(combat.cast("player-1", caster, "power-strike", "slime-1", 1_000L).accepted());
        assertFalse(combat.cast("player-1", caster, "power-strike", "slime-1", 1_500L).accepted());
    }

    @Test
    void allowsDifferentSkillCooldownsIndependently() {
        assertTrue(combat.cast("player-1", caster, "power-strike", "slime-1", 1_000L).accepted());
        assertTrue(combat.cast("player-1", caster, "arcane-bolt", "slime-1", 1_000L).accepted());
    }

    @Test
    void rejectsUnknownSkillWithoutTouchingMonster() {
        assertFalse(combat.cast("player-1", caster, "unknown", "slime-1", 1_000L).accepted());
    }
}
