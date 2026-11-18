package com.kpah.server.world;

public record LootDropState(
        String dropId,
        String itemCode,
        int amount,
        String mapId,
        double x,
        double y,
        long createdAt
) {
}
