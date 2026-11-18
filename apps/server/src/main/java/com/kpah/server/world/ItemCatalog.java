package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ItemCatalog {
    private final Map<String, ItemDefinition> items = Map.of(
            "green-slime-material", new ItemDefinition("green-slime-material", "Green Slime Gel", "material", "", 0, 0, 99),
            "forest-resin", new ItemDefinition("forest-resin", "Forest Resin", "material", "", 0, 0, 99),
            "wolf-fang", new ItemDefinition("wolf-fang", "Wolf Fang", "material", "", 0, 0, 99),
            "alpha-wolf-pelt", new ItemDefinition("alpha-wolf-pelt", "Alpha Wolf Pelt", "material", "", 0, 0, 20),
            "ancient-guardian-core", new ItemDefinition("ancient-guardian-core", "Ancient Guardian Core", "material", "", 0, 0, 10),
            "novice-sword", new ItemDefinition("novice-sword", "Novice Sword", "equipment", "weapon", 5, 0, 1),
            "cloth-tunic", new ItemDefinition("cloth-tunic", "Cloth Tunic", "equipment", "body", 0, 3, 1)
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

    public InventoryUpdate addToInventory(Map<String, Integer> current, String itemCode, int amount) {
        ItemDefinition item = find(itemCode);
        if (item == null || amount <= 0) return new InventoryUpdate(current, 0);
        int existing = current.getOrDefault(itemCode, 0);
        long occupiedSlots = current.values().stream().filter(quantity -> quantity > 0).count();
        if (existing <= 0 && occupiedSlots >= 20) return new InventoryUpdate(current, 0);
        int accepted = Math.min(amount, Math.max(0, item.maxStack() - existing));
        if (accepted == 0) return new InventoryUpdate(current, 0);
        java.util.Map<String, Integer> updated = new java.util.HashMap<>(current);
        updated.put(itemCode, existing + accepted);
        return new InventoryUpdate(Map.copyOf(updated), accepted);
    }

    public static int mitigateDamage(int incomingDamage, int defenseBonus) {
        if (incomingDamage <= 0) return 0;
        return Math.max(1, incomingDamage - Math.max(0, defenseBonus));
    }

    public record InventoryUpdate(Map<String, Integer> inventory, int acceptedAmount) {}

    public record ItemDefinition(String itemCode, String name, String type, String slot,
                                 int attackBonus, int defenseBonus, int maxStack) {}
}
