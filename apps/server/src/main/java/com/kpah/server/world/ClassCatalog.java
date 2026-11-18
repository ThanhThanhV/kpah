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

    public int maxHp(String classCode) { return maxHp(classCode, 1); }
    public int attackBonus(String classCode) { return attackBonus(classCode, 1); }
    public int defenseBonus(String classCode) { return defenseBonus(classCode, 1); }

    public int maxHp(String classCode, int level) {
        ClassDefinition base = require(classCode);
        return base.maxHp() + Math.max(0, level - 1) * hpGrowth(classCode);
    }

    public int attackBonus(String classCode, int level) {
        return require(classCode).attackBonus()
                + Math.max(0, level - 1) * attackGrowth(classCode);
    }

    public int defenseBonus(String classCode, int level) {
        return require(classCode).defenseBonus()
                + Math.max(0, level - 1) * defenseGrowth(classCode);
    }

    private int hpGrowth(String classCode) {
        return switch (classCode.toLowerCase(java.util.Locale.ROOT)) {
            case "warrior" -> 12;
            case "mage" -> 7;
            case "archer" -> 9;
            default -> throw new IllegalArgumentException("Unknown character class.");
        };
    }

    private int attackGrowth(String classCode) {
        return switch (classCode.toLowerCase(java.util.Locale.ROOT)) {
            case "warrior" -> 2;
            case "mage" -> 3;
            case "archer" -> 2;
            default -> throw new IllegalArgumentException("Unknown character class.");
        };
    }

    private int defenseGrowth(String classCode) {
        return switch (classCode.toLowerCase(java.util.Locale.ROOT)) {
            case "warrior", "archer" -> 1;
            case "mage" -> 0;
            default -> throw new IllegalArgumentException("Unknown character class.");
        };
    }

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
