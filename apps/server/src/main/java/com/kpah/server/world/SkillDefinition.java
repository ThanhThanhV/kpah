package com.kpah.server.world;

public record SkillDefinition(String skillId, String displayName, String classCode,
                              int damage, double range, long cooldownMillis, int manaCost,
                              int requiredLevel) {
    public SkillDefinition(String skillId, String displayName, String classCode,
                           int damage, double range, long cooldownMillis, int manaCost) {
        this(skillId, displayName, classCode, damage, range, cooldownMillis, manaCost, 1);
    }

    public SkillDefinition {
        if (skillId == null || skillId.isBlank() || displayName == null || displayName.isBlank()
                || classCode == null || classCode.isBlank() || damage <= 0
                || !Double.isFinite(range) || range <= 0 || cooldownMillis < 0 || manaCost < 0
                || requiredLevel < 1) {
            throw new IllegalArgumentException("Skill definition is invalid.");
        }
    }
}
