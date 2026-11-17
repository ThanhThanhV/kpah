package com.kpah.server.world;

public record PlayerMotionState(String mapId, double x, double y, long lastSequence) {
}
