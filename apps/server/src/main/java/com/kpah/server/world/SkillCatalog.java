package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class SkillCatalog {
    private final Map<String, SkillDefinition> skills = Map.of(
            "power-strike", new SkillDefinition("power-strike", "Power Strike", 40, 110.0, 3_500L),
            "arcane-bolt", new SkillDefinition("arcane-bolt", "Arcane Bolt", 25, 180.0, 1_800L)
    );

    public SkillDefinition find(String skillId) {
        return skills.get(skillId);
    }

    public Map<String, SkillDefinition> all() {
        return skills;
    }
}
