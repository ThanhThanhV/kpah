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
    void unknownMonsterHasNoConfiguredDrops() {
        assertTrue(table.roll("unknown-monster", new Random(7)).isEmpty());
    }
}
