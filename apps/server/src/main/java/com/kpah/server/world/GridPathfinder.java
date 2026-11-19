package com.kpah.server.world;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/**
 * Bounded A* navigation over the collision geometry authored in the Tiled map.
 * The grid is intentionally independent of rendering and is authoritative on the server.
 */
public final class GridPathfinder {
    private static final double CELL_SIZE = 24.0;
    private static final int MAX_EXPANSIONS = 8_000;
    private static final int[][] DIRECTIONS = {
            {1, 0}, {-1, 0}, {0, 1}, {0, -1},
            {1, 1}, {1, -1}, {-1, 1}, {-1, -1}
    };

    private final double width;
    private final double height;
    private final boolean[][] collisionBlocked;
    private final int columns;
    private final int rows;

    public GridPathfinder(WorldMapGeometry map) {
        this.width = map.width();
        this.height = map.height();
        this.columns = (int) Math.ceil(width / CELL_SIZE);
        this.rows = (int) Math.ceil(height / CELL_SIZE);
        this.collisionBlocked = new boolean[columns][rows];
        for (int cellX = 0; cellX < columns; cellX++) {
            for (int cellY = 0; cellY < rows; cellY++) {
                double centerX = Math.min((cellX + 0.5) * CELL_SIZE, width - 0.01);
                double centerY = Math.min((cellY + 0.5) * CELL_SIZE, height - 0.01);
                for (CollisionBox collision : map.collisions()) {
                    if (centerX >= collision.x() && centerX <= collision.x() + collision.width()
                            && centerY >= collision.y() && centerY <= collision.y() + collision.height()) {
                        collisionBlocked[cellX][cellY] = true;
                        break;
                    }
                }
            }
        }
    }

    public int cellX(double x) { return (int) Math.floor(x / CELL_SIZE); }
    public int cellY(double y) { return (int) Math.floor(y / CELL_SIZE); }

    public List<Waypoint> findPath(double startX, double startY, double targetX, double targetY,
                                   double minX, double minY, double maxX, double maxY) {
        Cell start = nearestWalkable(cellX(startX), cellY(startY), minX, minY, maxX, maxY);
        Cell goal = nearestWalkable(cellX(targetX), cellY(targetY), minX, minY, maxX, maxY);
        if (start == null || goal == null) return List.of();
        if (start.equals(goal)) return List.of(center(goal));

        PriorityQueue<Node> open = new PriorityQueue<>(Comparator.comparingDouble(Node::score));
        Map<Cell, Double> costs = new HashMap<>();
        Map<Cell, Cell> parents = new HashMap<>();
        costs.put(start, 0.0);
        open.add(new Node(start, heuristic(start, goal)));
        int expanded = 0;

        while (!open.isEmpty() && expanded++ < MAX_EXPANSIONS) {
            Node current = open.poll();
            double currentCost = costs.getOrDefault(current.cell(), Double.POSITIVE_INFINITY);
            if (current.score() > currentCost + heuristic(current.cell(), goal) + 0.0001) continue;
            if (current.cell().equals(goal)) return reconstruct(parents, start, goal);

            for (int[] direction : DIRECTIONS) {
                Cell next = new Cell(current.cell().x() + direction[0],
                        current.cell().y() + direction[1]);
                if (!walkable(next, minX, minY, maxX, maxY)) continue;
                boolean diagonal = direction[0] != 0 && direction[1] != 0;
                if (diagonal && (!walkable(new Cell(current.cell().x() + direction[0], current.cell().y()),
                        minX, minY, maxX, maxY)
                        || !walkable(new Cell(current.cell().x(), current.cell().y() + direction[1]),
                        minX, minY, maxX, maxY))) continue;

                double candidate = currentCost + (diagonal ? Math.sqrt(2.0) : 1.0);
                if (candidate >= costs.getOrDefault(next, Double.POSITIVE_INFINITY)) continue;
                costs.put(next, candidate);
                parents.put(next, current.cell());
                open.add(new Node(next, candidate + heuristic(next, goal)));
            }
        }
        return List.of();
    }

    private List<Waypoint> reconstruct(Map<Cell, Cell> parents, Cell start, Cell goal) {
        List<Waypoint> result = new ArrayList<>();
        Cell cursor = goal;
        while (!cursor.equals(start)) {
            result.add(center(cursor));
            cursor = parents.get(cursor);
            if (cursor == null) return List.of();
        }
        Collections.reverse(result);
        return List.copyOf(result);
    }

    private Cell nearestWalkable(int x, int y, double minX, double minY, double maxX, double maxY) {
        Cell origin = new Cell(x, y);
        if (walkable(origin, minX, minY, maxX, maxY)) return origin;
        for (int radius = 1; radius <= 4; radius++) {
            for (int dx = -radius; dx <= radius; dx++) {
                for (int dy = -radius; dy <= radius; dy++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) != radius) continue;
                    Cell candidate = new Cell(x + dx, y + dy);
                    if (walkable(candidate, minX, minY, maxX, maxY)) return candidate;
                }
            }
        }
        return null;
    }

    private boolean walkable(Cell cell, double minX, double minY, double maxX, double maxY) {
        if (cell.x() < 0 || cell.y() < 0 || cell.x() >= columns || cell.y() >= rows) return false;
        double x = Math.min((cell.x() + 0.5) * CELL_SIZE, width - 0.01);
        double y = Math.min((cell.y() + 0.5) * CELL_SIZE, height - 0.01);
        if (x < minX || x > maxX || y < minY || y > maxY) return false;
        return !collisionBlocked[cell.x()][cell.y()];
    }

    private Waypoint center(Cell cell) {
        return new Waypoint(Math.min((cell.x() + 0.5) * CELL_SIZE, width - 0.01),
                Math.min((cell.y() + 0.5) * CELL_SIZE, height - 0.01));
    }

    private double heuristic(Cell a, Cell b) {
        int dx = Math.abs(a.x() - b.x());
        int dy = Math.abs(a.y() - b.y());
        return Math.max(dx, dy) + (Math.sqrt(2.0) - 1.0) * Math.min(dx, dy);
    }

    private record Cell(int x, int y) { }
    private record Node(Cell cell, double score) { }
    public record Waypoint(double x, double y) { }
}
