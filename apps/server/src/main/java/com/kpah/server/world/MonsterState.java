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
        String state,
        double attackX,
        double attackY,
        double attackRadius) {

    public MonsterState(String monsterId, String monsterType, String mapId, String spawnRegionId,
                        double x, double y, double homeX, double homeY,
                        int hp, int maxHp, String state) {
        this(monsterId, monsterType, mapId, spawnRegionId, x, y, homeX, homeY,
                hp, maxHp, state, 0, 0, 0);
    }
}
