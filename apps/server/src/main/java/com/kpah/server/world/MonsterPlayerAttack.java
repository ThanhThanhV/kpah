package com.kpah.server.world;

public record MonsterPlayerAttack(
        String playerId,
        String monsterId,
        String monsterName,
        int damage,
        String action
) {
    public MonsterPlayerAttack(String playerId, String monsterId, int damage) {
        this(playerId, monsterId, "Monster", damage, "monster-attack");
    }
}
