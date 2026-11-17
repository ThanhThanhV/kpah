package com.kpah.server.world;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class WorldSocketHandler extends TextWebSocketHandler {
    private static final String DEFAULT_MAP = "starter-meadow";
    private final ObjectMapper mapper;
    private final MovementService movementService;
    private final MonsterSimulationService monsters;
    private final Map<String, ConnectedPlayer> players = new ConcurrentHashMap<>();

    public WorldSocketHandler(ObjectMapper mapper, MovementService movementService,
                              MonsterSimulationService monsters) {
        this.mapper = mapper;
        this.movementService = movementService;
        this.monsters = monsters;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String mapId = UriComponentsBuilder.fromUri(session.getUri())
                .build().getQueryParams().getFirst("mapId");
        if (mapId == null || mapId.isBlank()) mapId = DEFAULT_MAP;
        PlayerMotionState initial = movementService.initialState(mapId);
        ConnectedPlayer player = new ConnectedPlayer(
                UUID.randomUUID().toString(), session, initial, System.nanoTime());
        players.put(session.getId(), player);
        send(session, Map.of("type", "welcome", "playerId", player.playerId(), "mapId", mapId));
        broadcast(mapId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        ConnectedPlayer player = players.get(session.getId());
        if (player == null) return;
        try {
            JsonNode input = mapper.readTree(message.getPayload());
            if (!"move".equals(input.path("type").asText())) {
                send(session, Map.of("type", "error", "message", "Unsupported message type."));
                return;
            }
            long sequence = input.path("sequence").asLong(-1);
            double axisX = input.path("axisX").asDouble(Double.NaN);
            double axisY = input.path("axisY").asDouble(Double.NaN);
            long now = System.nanoTime();
            double elapsed = Math.min((now - player.lastAcceptedNanos()) / 1_000_000_000.0, 0.05);
            if (elapsed <= 0) elapsed = 0.001;
            PlayerMotionState next = movementService.apply(
                    player.state(), new MovementInput(axisX, axisY, sequence), elapsed);
            players.put(session.getId(), new ConnectedPlayer(
                    player.playerId(), session, next, now));
            broadcast(next.mapId());
        } catch (IllegalArgumentException exception) {
            send(session, Map.of("type", "error", "message", exception.getMessage()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        ConnectedPlayer removed = players.remove(session.getId());
        if (removed != null) broadcast(removed.state().mapId());
    }

    @Scheduled(fixedRate = 100)
    public void tickWorld() {
        monsters.advance(System.currentTimeMillis());
        players.values().stream().map(player -> player.state().mapId()).distinct().forEach(this::broadcast);
    }

    private void broadcast(String mapId) {
        var snapshots = players.values().stream()
                .filter(player -> mapId.equals(player.state().mapId()))
                .map(player -> Map.of(
                        "playerId", player.playerId(), "mapId", player.state().mapId(),
                        "x", player.state().x(), "y", player.state().y(),
                        "sequence", player.state().lastSequence()))
                .toList();
        Map<String, Object> payload = Map.of(
                "type", "snapshot", "players", snapshots, "monsters", monsters.snapshot(mapId));
        for (ConnectedPlayer player : players.values()) {
            if (mapId.equals(player.state().mapId()) && player.session().isOpen()) {
                try { send(player.session(), payload); }
                catch (IOException ignored) { /* websocket close lifecycle removes failed sessions */ }
            }
        }
    }

    private void send(WebSocketSession session, Object payload) throws IOException {
        if (!session.isOpen()) return;
        synchronized (session) {
            session.sendMessage(new TextMessage(mapper.writeValueAsString(payload)));
        }
    }

    private record ConnectedPlayer(
            String playerId, WebSocketSession session, PlayerMotionState state, long lastAcceptedNanos
    ) {}
}
