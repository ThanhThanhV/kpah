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
    public LootDropState withAmount(int nextAmount) {
        return new LootDropState(dropId, itemCode, nextAmount, mapId, x, y, createdAt);
    }
}
