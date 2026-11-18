package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MonsterAttackAreaTest {
    @Test
    void sweepHitsInsideLockedRectangleButNotBesideIt() {
        assertTrue(MonsterAttackArea.containsSweep(100, 100, 184, 64, 0, 180, 100));
        assertFalse(MonsterAttackArea.containsSweep(100, 100, 184, 64, 0, 180, 140));
    }

    @Test
    void sweepCollisionRotatesWithLockedFacingDirection() {
        assertTrue(MonsterAttackArea.containsSweep(100, 100, 184, 64, Math.PI / 2, 100, 180));
        assertFalse(MonsterAttackArea.containsSweep(100, 100, 184, 64, Math.PI / 2, 140, 180));
    }
}
