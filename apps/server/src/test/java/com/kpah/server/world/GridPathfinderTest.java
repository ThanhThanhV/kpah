package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class GridPathfinderTest {
    @Test
    void findsRouteAroundObstacle() {
        WorldMapGeometry map = new WorldMapGeometry("test", 240, 192, 24, 24,
                List.of(new CollisionBox(96, 24, 48, 144)), List.of());
        GridPathfinder pathfinder = new GridPathfinder(map);

        List<GridPathfinder.Waypoint> path = pathfinder.findPath(
                48, 96, 192, 96, 0, 0, 239, 191);

        assertFalse(path.isEmpty());
        assertTrue(path.stream().anyMatch(point -> point.y() < 24 || point.y() > 168));
    }

    @Test
    void returnsNoRouteWhenObstacleSeparatesMovementBounds() {
        WorldMapGeometry map = new WorldMapGeometry("test", 240, 192, 24, 24,
                List.of(new CollisionBox(96, 0, 48, 192)), List.of());
        GridPathfinder pathfinder = new GridPathfinder(map);

        List<GridPathfinder.Waypoint> path = pathfinder.findPath(
                48, 96, 192, 96, 0, 0, 239, 191);

        assertTrue(path.isEmpty());
    }

    @Test
    void returnsWaypointForAdjacentWalkableCell() {
        WorldMapGeometry map = new WorldMapGeometry("test", 240, 192, 24, 24, List.of(), List.of());
        GridPathfinder pathfinder = new GridPathfinder(map);

        List<GridPathfinder.Waypoint> path = pathfinder.findPath(
                48, 48, 72, 48, 0, 0, 239, 191);

        assertFalse(path.isEmpty());
        assertTrue(path.size() <= 2);
    }
}
