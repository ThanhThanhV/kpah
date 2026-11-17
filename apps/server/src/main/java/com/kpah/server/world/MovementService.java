package com.kpah.server.world;

import org.springframework.stereotype.Service;

/**
 * Server-side movement authority. The client submits directional intent and
 * sequence numbers; final coordinates are calculated here from server tick time.
 */
@Service
public class MovementService {
    private static final double WALK_SPEED = 190.0;
    private static final double MAX_TICK_SECONDS = 0.05;
    private static final double HALF_WIDTH = 12.0;
    private static final double HALF_HEIGHT = 9.0;
    private static final double VECTOR_EPSILON = 1.001;

    private final StarterWorldRegistry worlds;

    public MovementService(StarterWorldRegistry worlds) {
        this.worlds = worlds;
    }

    public PlayerMotionState initialState(String mapId) {
        WorldMapGeometry map = worlds.require(mapId);
        return new PlayerMotionState(map.mapId(), map.spawnX(), map.spawnY(), 0);
    }

    public PlayerMotionState apply(
            PlayerMotionState current,
            MovementInput input,
            double serverTickSeconds
    ) {
        if (current == null || input == null) {
            throw new IllegalArgumentException("Current state and movement input are required.");
        }
        if (input.sequence() <= current.lastSequence()) {
            throw new IllegalArgumentException("Movement sequence must increase monotonically.");
        }
        if (!Double.isFinite(input.axisX()) || !Double.isFinite(input.axisY())) {
            throw new IllegalArgumentException("Movement axes must be finite.");
        }
        if (!Double.isFinite(serverTickSeconds)
                || serverTickSeconds <= 0
                || serverTickSeconds > MAX_TICK_SECONDS) {
            throw new IllegalArgumentException("Server tick must be within (0, 0.05] seconds.");
        }

        double magnitude = Math.hypot(input.axisX(), input.axisY());
        if (magnitude > VECTOR_EPSILON) {
            throw new IllegalArgumentException("Movement vector exceeds allowed magnitude.");
        }

        WorldMapGeometry map = worlds.require(current.mapId());
        double candidateX = current.x() + input.axisX() * WALK_SPEED * serverTickSeconds;
        double candidateY = current.y() + input.axisY() * WALK_SPEED * serverTickSeconds;
        double resolvedX = resolveAxis(current.x(), candidateX, current.y(), true, map);
        double resolvedY = resolveAxis(current.y(), candidateY, resolvedX, false, map);

        double x = clamp(resolvedX, HALF_WIDTH, map.width() - HALF_WIDTH);
        double y = clamp(resolvedY, HALF_HEIGHT, map.height() - HALF_HEIGHT);
        return new PlayerMotionState(map.mapId(), x, y, input.sequence());
    }

    private double resolveAxis(
            double current,
            double candidate,
            double otherAxis,
            boolean horizontal,
            WorldMapGeometry map
    ) {
        for (CollisionBox box : map.collisions()) {
            boolean overlapsOther = horizontal
                    ? otherAxis + HALF_HEIGHT > box.y() && otherAxis - HALF_HEIGHT < box.y() + box.height()
                    : otherAxis + HALF_WIDTH > box.x() && otherAxis - HALF_WIDTH < box.x() + box.width();
            if (!overlapsOther) continue;

            boolean overlapsCandidate = horizontal
                    ? candidate + HALF_WIDTH > box.x() && candidate - HALF_WIDTH < box.x() + box.width()
                    : candidate + HALF_HEIGHT > box.y() && candidate - HALF_HEIGHT < box.y() + box.height();
            if (!overlapsCandidate) continue;

            if (horizontal) {
                return candidate > current
                        ? box.x() - HALF_WIDTH
                        : box.x() + box.width() + HALF_WIDTH;
            }
            return candidate > current
                    ? box.y() - HALF_HEIGHT
                    : box.y() + box.height() + HALF_HEIGHT;
        }
        return candidate;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
