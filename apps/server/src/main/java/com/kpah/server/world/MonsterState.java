package com.kpah.server.world;

public record MonsterState(
        String monsterId,
        String monsterType,
        String mapId,
        String spawnRegionId,
        double x,
        double y,
        double homeX,
        double homeY,
        int hp,
        int maxHp,
        String state
) {
}
