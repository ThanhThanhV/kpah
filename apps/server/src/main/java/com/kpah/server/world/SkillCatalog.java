package com.kpah.server.world;

import java.util.List;
import java.util.Map;
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

    public SkillDefinition find(String skillId) { return skills.get(skillId); }
    public Map<String, SkillDefinition> all() { return skills; }

    public Map<String, SkillDefinition> forClass(String classCode) {
        return skills.values().stream().filter(skill -> skill.classCode().equalsIgnoreCase(classCode))
                .collect(Collectors.toUnmodifiableMap(SkillDefinition::skillId, skill -> skill));
    }

    public Map<String, SkillDefinition> forClass(String classCode, int level) {
        return skills.values().stream().filter(skill -> skill.classCode().equalsIgnoreCase(classCode)
                        && skill.requiredLevel() <= level)
                .collect(Collectors.toUnmodifiableMap(SkillDefinition::skillId, skill -> skill));
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
}
