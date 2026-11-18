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
        double attackRadius,
        double attackWidth,
        double attackHeight,
        double attackAngle,
        String attackShape) {

    public MonsterState(String monsterId, String monsterType, String mapId, String spawnRegionId,
                        double x, double y, double homeX, double homeY,
                        int hp, int maxHp, String state,
                        double attackX, double attackY, double attackRadius) {
        this(monsterId, monsterType, mapId, spawnRegionId, x, y, homeX, homeY,
                hp, maxHp, state, attackX, attackY, attackRadius, 0, 0, 0,
                attackRadius > 0 ? "CIRCLE" : "");
    }

    public MonsterState(String monsterId, String monsterType, String mapId, String spawnRegionId,
                        double x, double y, double homeX, double homeY,
                        int hp, int maxHp, String state) {
        this(monsterId, monsterType, mapId, spawnRegionId, x, y, homeX, homeY,
                hp, maxHp, state, 0, 0, 0, 0, 0, 0, "");
    }
}
