package com.kpah.server.world;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class SkillCatalog {
    private final Map<String, SkillDefinition> skills = List.of(
            new SkillDefinition("warrior-power-strike", "Power Strike", "warrior", 40, 110.0, 3_500L, 30),
            new SkillDefinition("warrior-shield-break", "Shield Break", "warrior", 28, 90.0, 5_000L, 22, 3),
            new SkillDefinition("mage-arcane-bolt", "Arcane Bolt", "mage", 25, 180.0, 1_800L, 18),
            new SkillDefinition("mage-frost-shard", "Frost Shard", "mage", 48, 165.0, 4_500L, 32, 3),
            new SkillDefinition("archer-quick-shot", "Quick Shot", "archer", 30, 165.0, 2_200L, 16),
            new SkillDefinition("archer-piercing-arrow", "Piercing Arrow", "archer", 52, 210.0, 5_000L, 34, 3)
    ).stream().collect(Collectors.toUnmodifiableMap(SkillDefinition::skillId, skill -> skill));
    private final Map<String, List<SkillDefinition>> skillsByClass = skills.values().stream()
            .collect(Collectors.groupingBy(skill -> skill.classCode().toLowerCase(Locale.ROOT)));
    private final Map<String, Integer> maxRequiredLevelByClass = skillsByClass.entrySet().stream()
            .collect(Collectors.toUnmodifiableMap(Map.Entry::getKey,
                    entry -> entry.getValue().stream().mapToInt(SkillDefinition::requiredLevel).max().orElse(1)));
    private final Map<ClassLevel, Map<String, SkillDefinition>> classLevelCache = new ConcurrentHashMap<>();

    public SkillDefinition find(String skillId) { return skills.get(skillId); }
    public Map<String, SkillDefinition> all() { return skills; }

    public Map<String, SkillDefinition> forClass(String classCode) {
        return forClass(classCode, Integer.MAX_VALUE);
    }

    public Map<String, SkillDefinition> forClass(String classCode, int level) {
        if (classCode == null) return Map.of();
        String normalizedClass = classCode.toLowerCase(Locale.ROOT);
        List<SkillDefinition> classSkills = skillsByClass.get(normalizedClass);
        if (classSkills == null) return Map.of();
        int cacheLevel = Math.min(Math.max(1, level),
                maxRequiredLevelByClass.getOrDefault(normalizedClass, 1));
        return classLevelCache.computeIfAbsent(new ClassLevel(normalizedClass, cacheLevel), key -> {
            Map<String, SkillDefinition> available = new HashMap<>();
            for (SkillDefinition skill : classSkills) {
                if (skill.requiredLevel() <= key.level()) {
                    available.put(skill.skillId(), skill);
                }
            }
            return Map.copyOf(available);
        });
    }

    public int maxMana(String classCode) { return maxMana(classCode, 1); }

    public int maxMana(String classCode, int level) {
        int base = switch (classCode.toLowerCase(java.util.Locale.ROOT)) {
            case "warrior" -> 100;
            case "mage" -> 140;
            case "archer" -> 110;
            default -> throw new IllegalArgumentException("Unknown character class.");
        };
        int growth = switch (classCode.toLowerCase(java.util.Locale.ROOT)) {
            case "warrior" -> 5;
            case "mage" -> 8;
            case "archer" -> 6;
            default -> throw new IllegalArgumentException("Unknown character class.");
        };
        return base + Math.max(0, level - 1) * growth;
    }

    public int manaRegenerationPerSecond() { return 8; }

    private record ClassLevel(String classCode, int level) { }
}
