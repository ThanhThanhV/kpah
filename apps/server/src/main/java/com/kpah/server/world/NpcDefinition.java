package com.kpah.server.world;

public record NpcDefinition(
        String id, String name, double x, double y, double width, double height, String dialogue
) {
    public NpcDefinition(String id, String name, double x, double y, double width, double height) {
        this(id, name, x, y, width, height, "Greetings, traveler.");
    }

    public double centerX() { return x + width / 2.0; }
    public double centerY() { return y + height / 2.0; }
}
