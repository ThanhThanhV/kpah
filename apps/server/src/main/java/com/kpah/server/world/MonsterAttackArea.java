package com.kpah.server.world;

public final class MonsterAttackArea {
    private MonsterAttackArea() {}

    public static boolean containsCircle(double centerX, double centerY, double radius, double x, double y) {
        return Math.hypot(x - centerX, y - centerY) <= radius;
    }

    public static boolean containsSweep(double centerX, double centerY, double width, double height,
                                         double angle, double x, double y) {
        double dx = x - centerX;
        double dy = y - centerY;
        double cos = Math.cos(angle);
        double sin = Math.sin(angle);
        double localX = dx * cos + dy * sin;
        double localY = -dx * sin + dy * cos;
        return Math.abs(localX) <= width / 2.0 && Math.abs(localY) <= height / 2.0;
    }
}
