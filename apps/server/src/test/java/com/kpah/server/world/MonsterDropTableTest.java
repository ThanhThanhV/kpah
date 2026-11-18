package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Random;
import org.junit.jupiter.api.Test;

class MonsterDropTableTest {
    private final MonsterDropTable table = new MonsterDropTable();

    @Test
    void greenSlimeUsesConfiguredDropAndQuantityRange() {
        var drops = table.roll("green-slime", new Random(7));

        assertEquals(1, drops.size());
        assertEquals("green-slime-material", drops.getFirst().itemCode());
        assertTrue(drops.getFirst().amount() >= 1 && drops.getFirst().amount() <= 2);
    }

    @Test
    void forestSlimeCanDropRegionSpecificResin() {
        var drops = table.roll("forest-edge", "green-slime", new Random(0) { @Override public double nextDouble() { return 0.0; } });

        assertTrue(drops.stream().anyMatch(drop -> drop.itemCode().equals("green-slime-material")));
        assertTrue(drops.stream().anyMatch(drop -> drop.itemCode().equals("forest-resin")));
    }

    @Test
    void forestWolfDropsWolfFang() {
        var drops = table.roll("forest-edge", "forest-wolf",
                new Random(0) { @Override public double nextDouble() { return 0.0; } });

        assertEquals(1, drops.size());
        assertEquals("wolf-fang", drops.getFirst().itemCode());
        assertEquals(1, drops.getFirst().amount());
    }

    @Test
    void unknownMonsterHasNoConfiguredDrops() {
        assertTrue(table.roll("unknown-monster", new Random(7)).isEmpty());
    }
}
