package com.kpah.server.world;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Applies bounded per-connection message budgets before gameplay work is dispatched. */
@Component
public class WorldMessageRateLimiter {
    private static final Map<String, Integer> LIMITS_PER_SECOND = Map.of(
            "move", 30,
            "attack", 5,
            "cast", 5,
            "interact", 3,
            "equip", 5,
            "unequip", 5,
            "ping", 2);
    private static final int UNKNOWN_MESSAGE_LIMIT = 10;

    private final Map<String, ConnectionBudget> connections = new ConcurrentHashMap<>();

    public boolean tryAcquire(String connectionId, String messageType) {
        if (connectionId == null || connectionId.isBlank()) return false;
        String type = messageType == null || messageType.isBlank() ? "<missing>" : messageType;
        int limit = LIMITS_PER_SECOND.getOrDefault(type, UNKNOWN_MESSAGE_LIMIT);
        ConnectionBudget budget = connections.computeIfAbsent(connectionId, ignored -> new ConnectionBudget());
        return budget.tryAcquire(type, limit, System.nanoTime());
    }

    public void remove(String connectionId) {
        if (connectionId != null) connections.remove(connectionId);
    }

    private static final class ConnectionBudget {
        private final Map<String, Window> windows = new ConcurrentHashMap<>();

        private boolean tryAcquire(String type, int limit, long nowNanos) {
            Window window = windows.computeIfAbsent(type, ignored -> new Window(nowNanos));
            synchronized (window) {
                if (nowNanos - window.startedAtNanos >= 1_000_000_000L
                        || nowNanos < window.startedAtNanos) {
                    window.startedAtNanos = nowNanos;
                    window.accepted = 0;
                }
                if (window.accepted >= limit) return false;
                window.accepted++;
                return true;
            }
        }
    }

    private static final class Window {
        private long startedAtNanos;
        private int accepted;

        private Window(long startedAtNanos) {
            this.startedAtNanos = startedAtNanos;
        }
    }
}
