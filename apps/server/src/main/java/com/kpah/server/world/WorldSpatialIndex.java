package com.kpah.server.world;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.ToDoubleFunction;

/**
 * Mutable uniform-grid index for entities whose positions change frequently.
 * Updates move one entity between cells instead of rebuilding the complete grid.
 */
final class WorldSpatialIndex<T> {
    private static final int CELL_SIZE = 300;

    private final Map<Cell, Map<String, Point<T>>> cells = new HashMap<>();
    private final Map<String, Cell> locations = new HashMap<>();

    static <T> WorldSpatialIndex<T> build(
            Collection<T> values,
            ToDoubleFunction<T> xCoordinate,
            ToDoubleFunction<T> yCoordinate) {
        WorldSpatialIndex<T> index = new WorldSpatialIndex<>();
        int sequence = 0;
        for (T value : values) {
            index.upsert("build-" + sequence++, xCoordinate.applyAsDouble(value),
                    yCoordinate.applyAsDouble(value), value);
        }
        return index;
    }

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
        List<T> result = new ArrayList<>();
        queryInto(centerX, centerY, radius, result);
        return result;
    }

    synchronized void queryInto(double centerX, double centerY, double radius, List<T> result) {
        if (!Double.isFinite(centerX) || !Double.isFinite(centerY)
                || !Double.isFinite(radius) || radius < 0) {
            return;
        }
        int minCellX = cellCoordinate(centerX - radius);
        int maxCellX = cellCoordinate(centerX + radius);
        int minCellY = cellCoordinate(centerY - radius);
        int maxCellY = cellCoordinate(centerY + radius);
        double radiusSquared = radius * radius;
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
    }

    synchronized void retainOnly(java.util.Set<String> retainedIds) {
        var iterator = locations.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Cell> entry = iterator.next();
            if (!retainedIds.contains(entry.getKey())) {
                Cell cell = entry.getValue();
                Map<String, Point<T>> points = cells.get(cell);
                if (points != null) {
                    points.remove(entry.getKey());
                    if (points.isEmpty()) cells.remove(cell);
                }
                iterator.remove();
            }
        }
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
