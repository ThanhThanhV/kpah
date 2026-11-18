package com.kpah.server.world;

import java.util.List;
import java.util.Map;
import java.util.random.RandomGenerator;
import org.springframework.stereotype.Component;

@Component
public class MonsterDropTable {
    private final Map<String, List<DropEntry>> fallbackTables = Map.of(
            "green-slime", List.of(new DropEntry("green-slime-material", 1.0, 1, 2)),
            "forest-wolf", List.of(new DropEntry("wolf-fang", 0.6, 1, 1))
    );

    private final Map<String, Map<String, List<DropEntry>>> tablesByMap = Map.of(
            "starter-meadow", Map.of(
                    "green-slime", List.of(new DropEntry("green-slime-material", 1.0, 1, 2))
            ),
            "forest-edge", Map.of(
                    "green-slime", List.of(
                            new DropEntry("green-slime-material", 1.0, 1, 2),
                            new DropEntry("forest-resin", 0.35, 1, 1)
                    ),
                    "forest-wolf", List.of(new DropEntry("wolf-fang", 0.6, 1, 1))
            )
    );

    public List<RolledDrop> roll(String monsterType, RandomGenerator random) {
        return rollFrom(fallbackTables.getOrDefault(monsterType, List.of()), random);
    }

    public List<RolledDrop> roll(String mapId, String monsterType, RandomGenerator random) {
        if (mapId == null || monsterType == null) return List.of();
        List<DropEntry> table = tablesByMap.getOrDefault(mapId, Map.of())
                .getOrDefault(monsterType, fallbackTables.getOrDefault(monsterType, List.of()));
        return rollFrom(table, random);
    }

    private List<RolledDrop> rollFrom(List<DropEntry> table, RandomGenerator random) {
        if (random == null) return List.of();
        return table.stream()
                .filter(entry -> random.nextDouble() < entry.chance())
                .map(entry -> new RolledDrop(entry.itemCode(),
                        random.nextInt(entry.minAmount(), entry.maxAmount() + 1)))
                .toList();
    }

    public record DropEntry(String itemCode, double chance, int minAmount, int maxAmount) {
        public DropEntry {
            if (itemCode == null || itemCode.isBlank() || !Double.isFinite(chance)
                    || chance < 0 || chance > 1 || minAmount < 1 || maxAmount < minAmount) {
                throw new IllegalArgumentException("Monster drop entry is invalid.");
            }
        }
    }

    public record RolledDrop(String itemCode, int amount) {}
}
