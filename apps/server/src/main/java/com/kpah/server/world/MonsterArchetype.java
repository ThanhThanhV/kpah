package com.kpah.server.world;

public record MonsterArchetype(
        String monsterType,
        String displayName,
        int maxHp,
        int attackDamage,
        double attackRange,
        double aggroRange,
        long attackCooldownMillis,
        double moveSpeedMultiplier,
        MonsterBehavior behavior,
        MonsterSpecialAttack specialAttack
) {
    public MonsterArchetype(String monsterType, String displayName, int maxHp, int attackDamage,
                            double attackRange, double aggroRange, long attackCooldownMillis,
                            double moveSpeedMultiplier, MonsterBehavior behavior) {
        this(monsterType, displayName, maxHp, attackDamage, attackRange, aggroRange,
                attackCooldownMillis, moveSpeedMultiplier, behavior, MonsterSpecialAttack.CIRCLE);
    }
    public MonsterArchetype {
        if (monsterType == null || monsterType.isBlank()
                || displayName == null || displayName.isBlank()
                || maxHp < 1 || attackDamage < 0
                || !Double.isFinite(attackRange) || attackRange <= 0
                || !Double.isFinite(aggroRange) || aggroRange < attackRange
                || attackCooldownMillis < 100
                || !Double.isFinite(moveSpeedMultiplier) || moveSpeedMultiplier <= 0
                || behavior == null || specialAttack == null) {
            throw new IllegalArgumentException("Monster archetype configuration is invalid.");
        }
    }
}
