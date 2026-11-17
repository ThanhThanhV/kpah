package com.kpah.server.world;

public record MonsterSpawnRegion(
        String id,
        String monsterType,
        double x,
        double y,
        double width,
        double height,
        int maxAlive,
        long respawnMillis,
        double roamRadius,
        double moveSpeed
) {
    public MonsterSpawnRegion {
        if (id == null || id.isBlank() || monsterType == null || monsterType.isBlank()
                || !Double.isFinite(x) || !Double.isFinite(y)
                || !Double.isFinite(width) || !Double.isFinite(height)
                || width <= 0 || height <= 0 || maxAlive < 1
                || respawnMillis < 250 || !Double.isFinite(roamRadius) || roamRadius < 0
                || !Double.isFinite(moveSpeed) || moveSpeed < 0) {
            throw new IllegalArgumentException("Monster spawn region configuration is invalid.");
        }
    }

    public double centerX() { return x + width / 2.0; }
    public double centerY() { return y + height / 2.0; }
}
