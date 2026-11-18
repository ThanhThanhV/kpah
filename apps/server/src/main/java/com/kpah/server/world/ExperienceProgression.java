package com.kpah.server.world;

public final class ExperienceProgression {
    private static final int EXPERIENCE_PER_LEVEL = 100;

    private ExperienceProgression() {
    }

    public static int levelFor(int totalExperience) {
        return Math.max(1, totalExperience / EXPERIENCE_PER_LEVEL + 1);
    }

    public static int experienceIntoLevel(int totalExperience) {
        return Math.max(0, totalExperience) % EXPERIENCE_PER_LEVEL;
    }

    public static int experienceToNextLevel(int totalExperience) {
        return EXPERIENCE_PER_LEVEL - experienceIntoLevel(totalExperience);
    }
}
