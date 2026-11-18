package com.kpah.server.world;

public record SkillDefinition(String skillId, String displayName, int damage,
                              double range, long cooldownMillis) {
    public SkillDefinition {
        if (skillId == null || skillId.isBlank() || displayName == null || displayName.isBlank()
                || damage <= 0 || !Double.isFinite(range) || range <= 0 || cooldownMillis < 0) {
            throw new IllegalArgumentException("Skill definition is invalid.");
        }
    }
}
