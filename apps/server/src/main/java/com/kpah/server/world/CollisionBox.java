package com.kpah.server.world;

public record CollisionBox(double x, double y, double width, double height) {
    public CollisionBox {
        if (!Double.isFinite(x) || !Double.isFinite(y)
                || !Double.isFinite(width) || !Double.isFinite(height)
                || width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Collision box dimensions must be finite and positive.");
        }
    }
}
