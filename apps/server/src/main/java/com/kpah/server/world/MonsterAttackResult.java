package com.kpah.server.world;

public record MonsterAttackResult(boolean accepted, String message, MonsterState monster, int damage) {
    public static MonsterAttackResult rejected(String message) {
        return new MonsterAttackResult(false, message, null, 0);
    }
}
