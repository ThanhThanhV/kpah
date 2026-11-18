package com.kpah.server.world;

public record SkillDefinition(String skillId, String displayName, String classCode,
                              int damage, double range, long cooldownMillis, int manaCost) {
    public SkillDefinition {
        if (skillId == null || skillId.isBlank() || displayName == null || displayName.isBlank()
                || classCode == null || classCode.isBlank() || damage <= 0
                || !Double.isFinite(range) || range <= 0 || cooldownMillis < 0 || manaCost < 0) {
            throw new IllegalArgumentException("Skill definition is invalid.");
        }
    }
}
