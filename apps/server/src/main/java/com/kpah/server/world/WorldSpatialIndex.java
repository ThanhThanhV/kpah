package com.kpah.server.world;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.ToDoubleFunction;

/**
 * Immutable uniform-grid index for querying entities near a world position.
 * Rebuilt once per map snapshot so each recipient only visits intersecting cells.
 */
final class WorldSpatialIndex<T> {
    private static final int CELL_SIZE = 300;

    private final Map<Cell, List<Point<T>>> cells;

    private WorldSpatialIndex(Map<Cell, List<Point<T>>> cells) {
        this.cells = cells;
    }

    static <T> WorldSpatialIndex<T> build(
            Collection<T> values,
            ToDoubleFunction<T> xCoordinate,
            ToDoubleFunction<T> yCoordinate) {
        Map<Cell, List<Point<T>>> mutableCells = new HashMap<>();
        for (T value : values) {
            double x = xCoordinate.applyAsDouble(value);
            double y = yCoordinate.applyAsDouble(value);
            if (!Double.isFinite(x) || !Double.isFinite(y)) continue;
            Cell cell = cellFor(x, y);
            mutableCells.computeIfAbsent(cell, ignored -> new ArrayList<>())
                    .add(new Point<>(x, y, value));
        }
        Map<Cell, List<Point<T>>> immutableCells = new HashMap<>();
        mutableCells.forEach((cell, points) -> immutableCells.put(cell, List.copyOf(points)));
        return new WorldSpatialIndex<>(Map.copyOf(immutableCells));
    }

    List<T> query(double centerX, double centerY, double radius) {
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
                List<Point<T>> points = cells.get(new Cell(cellX, cellY));
                if (points == null) continue;
                for (Point<T> point : points) {
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
