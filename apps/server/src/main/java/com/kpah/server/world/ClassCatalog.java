package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ClassCatalog {
    private final Map<String, ClassDefinition> classes = Map.of(
            "warrior", new ClassDefinition("warrior", "Warrior", 120, 3, 2,
                    "Front-line fighter with high health and defense."),
            "mage", new ClassDefinition("mage", "Mage", 90, 8, 0,
                    "High magical attack with lower health and armor."),
            "archer", new ClassDefinition("archer", "Archer", 100, 5, 1,
                    "Balanced ranged fighter with steady damage.")
    );

    public ClassDefinition find(String classCode) {
        return classCode == null ? null : classes.get(classCode.toLowerCase(java.util.Locale.ROOT));
    }

    public ClassDefinition require(String classCode) {
        ClassDefinition definition = find(classCode);
        if (definition == null) throw new IllegalArgumentException("Unknown character class.");
        return definition;
    }

    public int maxHp(String classCode) { return require(classCode).maxHp(); }
    public int attackBonus(String classCode) { return require(classCode).attackBonus(); }
    public int defenseBonus(String classCode) { return require(classCode).defenseBonus(); }
    public Map<String, ClassDefinition> all() { return classes; }

    public record ClassDefinition(String classCode, String displayName, int maxHp,
                                  int attackBonus, int defenseBonus, String description) {
        public ClassDefinition {
            if (classCode == null || classCode.isBlank() || displayName == null || displayName.isBlank()
                    || maxHp < 1 || attackBonus < 0 || defenseBonus < 0) {
                throw new IllegalArgumentException("Class definition is invalid.");
            }
        }
    }
}
