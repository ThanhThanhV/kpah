package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ItemCatalog {
    private final Map<String, ItemDefinition> items = Map.of(
            "green-slime-material", new ItemDefinition("green-slime-material", "Green Slime Gel", "material", "", 0, 0),
            "novice-sword", new ItemDefinition("novice-sword", "Novice Sword", "equipment", "weapon", 5, 0),
            "cloth-tunic", new ItemDefinition("cloth-tunic", "Cloth Tunic", "equipment", "body", 0, 3)
    );

    public ItemDefinition find(String itemCode) { return items.get(itemCode); }
    public ItemDefinition requireEquipment(String itemCode) {
        ItemDefinition item = find(itemCode);
        if (item == null || !"equipment".equals(item.type()) || item.slot().isBlank()) {
            throw new IllegalArgumentException("This item cannot be equipped.");
        }
        return item;
    }
    public Map<String, ItemDefinition> all() { return items; }

    public int attackBonus(Map<String, String> equipment) {
        return equipmentBonus(equipment, true);
    }

    public int defenseBonus(Map<String, String> equipment) {
        return equipmentBonus(equipment, false);
    }

    private int equipmentBonus(Map<String, String> equipment, boolean attack) {
        if (equipment == null || equipment.isEmpty()) return 0;
        return equipment.entrySet().stream()
                .map(entry -> {
                    ItemDefinition item = items.get(entry.getValue());
                    if (item == null || !item.slot().equals(entry.getKey())) return 0;
                    return attack ? item.attackBonus() : item.defenseBonus();
                })
                .mapToInt(Integer::intValue)
                .sum();
    }

    public static int mitigateDamage(int incomingDamage, int defenseBonus) {
        if (incomingDamage <= 0) return 0;
        return Math.max(1, incomingDamage - Math.max(0, defenseBonus));
    }

    public record ItemDefinition(String itemCode, String name, String type, String slot,
                                 int attackBonus, int defenseBonus) {}
}
