package com.kpah.server.world;

public record SkillCastResult(boolean accepted, String message,
                              SkillDefinition skill, MonsterAttackResult attack, int manaRemaining) {
    public static SkillCastResult rejected(String message, int manaRemaining) {
        return new SkillCastResult(false, message, null, null, manaRemaining);
    }
}
