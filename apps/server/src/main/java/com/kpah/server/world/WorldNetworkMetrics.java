package com.kpah.server.world;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * Low-cardinality WebSocket telemetry. Message types are protocol constants,
 * not user-provided values; no account, character or session identifiers are recorded.
 */
@Component
public class WorldNetworkMetrics {
    private final MeterRegistry registry;
    private final AtomicInteger activeConnections = new AtomicInteger();
    private final Map<String, Counter> outboundCounters = new ConcurrentHashMap<>();
    private final Map<String, Counter> failureCounters = new ConcurrentHashMap<>();
    private final Map<String, DistributionSummary> payloadSizes = new ConcurrentHashMap<>();
    private final Map<String, Timer> sendTimers = new ConcurrentHashMap<>();

    public WorldNetworkMetrics(MeterRegistry registry) {
        this.registry = registry;
        registry.gauge("world.websocket.connections.active", activeConnections);
    }

    public void connectionOpened() {
        activeConnections.incrementAndGet();
    }

    public void connectionClosed() {
        activeConnections.updateAndGet(current -> Math.max(0, current - 1));
    }

    public void recordSend(String messageType, int payloadBytes, long elapsedNanos, boolean successful) {
        String type = normalizeType(messageType);
        sendTimers.computeIfAbsent(type, key ->
                registry.timer("world.websocket.send.duration", "message_type", key))
                .record(Math.max(0L, elapsedNanos), java.util.concurrent.TimeUnit.NANOSECONDS);
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

    private String normalizeType(String messageType) {
        return messageType == null || !messageType.matches("[a-z][a-z0-9-]{0,31}")
                ? "unknown" : messageType;
    }
}
