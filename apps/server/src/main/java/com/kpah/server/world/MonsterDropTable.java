package com.kpah.server.world;

import java.util.List;
import java.util.Map;
import java.util.random.RandomGenerator;
import org.springframework.stereotype.Component;

@Component
public class MonsterDropTable {
    private final Map<String, List<DropEntry>> tables = Map.of(
            "green-slime", List.of(new DropEntry("green-slime-material", 1.0, 1, 2))
    );

    public List<RolledDrop> roll(String monsterType, RandomGenerator random) {
        if (monsterType == null || random == null) return List.of();
        return tables.getOrDefault(monsterType, List.of()).stream()
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
