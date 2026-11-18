package com.kpah.server.world;

public record PortalDefinition(
        String id,
        String targetMapId,
        double x,
        double y,
        double width,
        double height,
        double targetX,
        double targetY
) {
    public PortalDefinition {
        if (id == null || id.isBlank() || targetMapId == null || targetMapId.isBlank()
                || !Double.isFinite(x) || !Double.isFinite(y)
                || !Double.isFinite(width) || !Double.isFinite(height)
                || width <= 0 || height <= 0
                || !Double.isFinite(targetX) || !Double.isFinite(targetY)
                || x < 0 || y < 0) {
            throw new IllegalArgumentException("Portal identity and geometry are required.");
        }
    }

    public boolean contains(double pointX, double pointY) {
        return pointX >= x && pointX <= x + width && pointY >= y && pointY <= y + height;
    }
}
