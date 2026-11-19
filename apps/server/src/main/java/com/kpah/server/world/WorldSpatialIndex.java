package com.kpah.server.world;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mutable uniform-grid index for entities whose positions change frequently.
 * Updates move one entity between cells instead of rebuilding the complete grid.
 */
final class WorldSpatialIndex<T> {
    private static final int CELL_SIZE = 300;

    private final Map<Cell, Map<String, Point<T>>> cells = new HashMap<>();
    private final Map<String, Cell> locations = new HashMap<>();

    synchronized void upsert(String id, double x, double y, T value) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Spatial index id must not be blank.");
        }
        if (!Double.isFinite(x) || !Double.isFinite(y)) {
            remove(id);
            return;
        }

        Cell nextCell = cellFor(x, y);
        Cell previousCell = locations.put(id, nextCell);
        if (previousCell != null && !previousCell.equals(nextCell)) {
            removeFromCell(previousCell, id);
        }
        cells.computeIfAbsent(nextCell, ignored -> new HashMap<>())
                .put(id, new Point<>(x, y, value));
    }

    synchronized void remove(String id) {
        Cell previousCell = locations.remove(id);
        if (previousCell != null) {
            removeFromCell(previousCell, id);
        }
    }

    synchronized List<T> query(double centerX, double centerY, double radius) {
        if (!Double.isFinite(centerX) || !Double.isFinite(centerY)
                || !Double.isFinite(radius) || radius < 0) {
            return List.of();
        }
        int minCellX = cellCoordinate(centerX - radius);
        int maxCellX = cellCoordinate(centerX + radius);
        int minCellY = cellCoordinate(centerY - radius);
        int maxCellY = cellCoordinate(centerY + radius);
        double radiusSquared = radius * radius;
        List<T> result = new ArrayList<>();
        for (int cellX = minCellX; cellX <= maxCellX; cellX++) {
            for (int cellY = minCellY; cellY <= maxCellY; cellY++) {
                Map<String, Point<T>> points = cells.get(new Cell(cellX, cellY));
                if (points == null) continue;
                for (Point<T> point : points.values()) {
                    double deltaX = point.x() - centerX;
                    double deltaY = point.y() - centerY;
                    if (deltaX * deltaX + deltaY * deltaY <= radiusSquared) {
                        result.add(point.value());
                    }
                }
            }
        }
        return result;
    }

    synchronized int size() {
        return locations.size();
    }

    private void removeFromCell(Cell cell, String id) {
        Map<String, Point<T>> points = cells.get(cell);
        if (points == null) return;
        points.remove(id);
        if (points.isEmpty()) cells.remove(cell);
    }

    private static Cell cellFor(double x, double y) {
        return new Cell(cellCoordinate(x), cellCoordinate(y));
    }

    private static int cellCoordinate(double coordinate) {
        return (int) Math.floor(coordinate / CELL_SIZE);
    }

    private record Cell(int x, int y) {
    }

    private record Point<T>(double x, double y, T value) {
    }
}
