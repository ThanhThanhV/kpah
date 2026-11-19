package com.kpah.server.world;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * Low-cardinality WebSocket telemetry. Only fixed protocol message types and
 * registered map IDs are used as tags; account, character and session IDs are never recorded.
 */
@Component
public class WorldNetworkMetrics {
    private static final java.util.Set<String> MESSAGE_TYPES = java.util.Set.of(
            "move", "attack", "cast", "interact", "equip", "unequip", "ping");

    private final MeterRegistry registry;
    private final AtomicInteger activeConnections = new AtomicInteger();
    private final Map<String, AtomicInteger> activeConnectionsByMap = new ConcurrentHashMap<>();
    private final Map<String, Counter> inboundCounters = new ConcurrentHashMap<>();
    private final Map<String, Counter> rateLimitedCounters = new ConcurrentHashMap<>();
    private final Map<String, Counter> outboundCounters = new ConcurrentHashMap<>();
    private final Map<String, Counter> failureCounters = new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> payloadSizes = new ConcurrentHashMap<>();
    private final Map<String, Timer> sendTimers = new ConcurrentHashMap<>();
    private final Map<String, Timer> snapshotTimers = new ConcurrentHashMap<>();
    private final Map<String, Counter> snapshotCounters = new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> snapshotEntityCounts = new ConcurrentHashMap<>();

    public WorldNetworkMetrics(MeterRegistry registry) {
        this.registry = registry;
        registry.gauge("world.websocket.connections.active", activeConnections);
    }

    public void connectionOpened(String mapId) {
        activeConnections.incrementAndGet();
        mapCounter(mapId).incrementAndGet();
    }

    public void connectionClosed(String mapId) {
        activeConnections.updateAndGet(current -> Math.max(0, current - 1));
        mapCounter(mapId).updateAndGet(current -> Math.max(0, current - 1));
    }

    public void mapChanged(String previousMapId, String nextMapId) {
        if (java.util.Objects.equals(previousMapId, nextMapId)) return;
        mapCounter(previousMapId).updateAndGet(current -> Math.max(0, current - 1));
        mapCounter(nextMapId).incrementAndGet();
    }

    public void recordInbound(String messageType, boolean rateLimited) {
        String type = normalizeType(messageType);
        inboundCounters.computeIfAbsent(type, key ->
                registry.counter("world.websocket.inbound.messages", "message_type", key)).increment();
        if (rateLimited) {
            rateLimitedCounters.computeIfAbsent(type, key ->
                    registry.counter("world.websocket.inbound.rate_limited", "message_type", key)).increment();
        }
    }

    public void recordSend(String messageType, int payloadBytes, long elapsedNanos, boolean successful) {
        String type = normalizeType(messageType);
        sendTimers.computeIfAbsent(type, key ->
                registry.timer("world.websocket.send.duration", "message_type", key))
                .record(Math.max(0L, elapsedNanos), TimeUnit.NANOSECONDS);
        if (successful) {
            outboundCounters.computeIfAbsent(type, key ->
                    registry.counter("world.websocket.outbound.messages", "message_type", key)).increment();
            payloadSizes.computeIfAbsent(type, key ->
                    DistributionSummary.builder("world.websocket.outbound.payload")
                            .tag("message_type", key)
                            .baseUnit("bytes")
                            .register(registry))
                    .record(Math.max(0, payloadBytes));
        } else {
            failureCounters.computeIfAbsent(type, key ->
                    registry.counter("world.websocket.send.failures", "message_type", key)).increment();
        }
    }

    public void recordSnapshot(boolean fullSnapshot, int visibleEntityCount, long elapsedNanos) {
        String mode = fullSnapshot ? "full" : "delta";
        snapshotTimers.computeIfAbsent(mode, key ->
                registry.timer("world.websocket.snapshot.duration", "snapshot_type", key))
                .record(Math.max(0L, elapsedNanos), TimeUnit.NANOSECONDS);
        snapshotCounters.computeIfAbsent(mode, key ->
                registry.counter("world.websocket.snapshot.messages", "snapshot_type", key)).increment();
        snapshotEntityCounts.computeIfAbsent(mode, key ->
                DistributionSummary.builder("world.websocket.snapshot.visible_entities")
                        .tag("snapshot_type", key)
                        .register(registry))
                .record(Math.max(0, visibleEntityCount));
    }

    private AtomicInteger mapCounter(String mapId) {
        String key = mapId != null && mapId.matches("[a-z0-9-]{1,48}") ? mapId : "unknown";
        return activeConnectionsByMap.computeIfAbsent(key, mapKey -> {
            AtomicInteger count = new AtomicInteger();
            Gauge.builder("world.websocket.connections.active.by_map", count, AtomicInteger::get)
                    .tag("map_id", mapKey)
                    .register(registry);
            return count;
        });
    }

    private String normalizeType(String messageType) {
        return MESSAGE_TYPES.contains(messageType) ? messageType : "other";
    }
}
