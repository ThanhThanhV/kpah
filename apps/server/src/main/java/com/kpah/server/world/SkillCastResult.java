package com.kpah.server.world;

public record SkillCastResult(boolean accepted, String message,
                              SkillDefinition skill, MonsterAttackResult attack) {
    public static SkillCastResult rejected(String message) {
        return new SkillCastResult(false, message, null, null);
    }
}
