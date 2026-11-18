package com.kpah.server.world;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
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
    private static final int PLAYER_MAX_HP = 100;
    private static final long PLAYER_RESPAWN_MILLIS = 3_000L;

    private final ObjectMapper mapper;
    private final MovementService movementService;
    private final MonsterSimulationService monsters;
    private final WorldCombatService combat;
    private final Map<String, ConnectedPlayer> players = new ConcurrentHashMap<>();

    public WorldSocketHandler(ObjectMapper mapper, MovementService movementService,
                              MonsterSimulationService monsters, WorldCombatService combat) {
        this.mapper = mapper;
        this.movementService = movementService;
        this.monsters = monsters;
        this.combat = combat;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String mapId = UriComponentsBuilder.fromUri(session.getUri())
                .build().getQueryParams().getFirst("mapId");
        if (mapId == null || mapId.isBlank()) mapId = DEFAULT_MAP;
        PlayerMotionState initial = movementService.initialState(mapId);
        ConnectedPlayer player = new ConnectedPlayer(
                UUID.randomUUID().toString(), session, initial, System.nanoTime(),
                PLAYER_MAX_HP, 0L, 0, Map.of());
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
            String type = input.path("type").asText();
            if ("move".equals(type)) {
                if (player.hp() <= 0) return;
                long sequence = input.path("sequence").asLong(-1);
                double axisX = input.path("axisX").asDouble(Double.NaN);
                double axisY = input.path("axisY").asDouble(Double.NaN);
                long now = System.nanoTime();
                double elapsed = Math.min((now - player.lastAcceptedNanos()) / 1_000_000_000.0, 0.05);
                if (elapsed <= 0) elapsed = 0.001;
                PlayerMotionState next = movementService.apply(
                        player.state(), new MovementInput(axisX, axisY, sequence), elapsed);
                players.put(session.getId(), player.withState(next, now));
                broadcast(next.mapId());
            } else if ("attack".equals(type)) {
                if (player.hp() <= 0) {
                    send(session, Map.of("type", "error", "message", "You cannot attack while defeated."));
                    return;
                }
                String targetId = input.path("targetMonsterId").asText("");
                MonsterAttackResult result = combat.basicAttack(
                        player.playerId(), player.state(), targetId, System.currentTimeMillis());
                if (!result.accepted()) {
                    send(session, Map.of("type", "error", "message", result.message()));
                } else {
                    if (result.monster().hp() == 0) {
                        players.computeIfPresent(session.getId(), (id, current) ->
                                current.withExperience(current.experience() + 25));
                    }
                    send(session, Map.of("type", "combat", "action", "basic-attack",
                            "targetMonsterId", targetId, "damage", result.damage(),
                            "monsterHp", result.monster().hp(),
                            "experienceReward", result.monster().hp() == 0 ? 25 : 0));
                    broadcast(player.state().mapId());
                }
            } else {
                send(session, Map.of("type", "error", "message", "Unsupported message type."));
            }
        } catch (IllegalArgumentException exception) {
            send(session, Map.of("type", "error", "message", exception.getMessage()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        ConnectedPlayer removed = players.remove(session.getId());
        if (removed != null) {
            combat.removePlayer(removed.playerId());
            broadcast(removed.state().mapId());
        }
    }

    @Scheduled(fixedRate = 100)
    public void tickWorld() {
        long now = System.currentTimeMillis();
        List<MonsterSimulationService.MonsterTarget> targets = players.values().stream()
                .filter(player -> player.hp() > 0)
                .map(player -> new MonsterSimulationService.MonsterTarget(
                        player.playerId(), player.state().mapId(), player.state().x(), player.state().y()))
                .toList();

        for (MonsterPlayerAttack attack : monsters.advance(now, targets)) {
            players.replaceAll((sessionId, player) -> {
                if (!player.playerId().equals(attack.playerId()) || player.hp() <= 0) return player;
                int hp = Math.max(0, player.hp() - attack.damage());
                long respawnAt = hp == 0 ? now + PLAYER_RESPAWN_MILLIS : 0L;
                return player.withVitals(hp, respawnAt);
            });
        }

        for (Map.Entry<String, ConnectedPlayer> entry : players.entrySet()) {
            String sessionId = entry.getKey();
            ConnectedPlayer current = entry.getValue();
            if (current.hp() <= 0) continue;
            List<LootDropState> collected = monsters.collectNearbyLoot(
                    current.state().mapId(), current.state().x(), current.state().y());
            if (!collected.isEmpty()) {
                players.computeIfPresent(sessionId, (id, latest) -> latest.withLoot(collected));
            }
        }

        players.replaceAll((sessionId, player) -> {
            if (player.hp() > 0 || player.respawnAt() == 0L || now < player.respawnAt()) return player;
            PlayerMotionState spawn = movementService.initialState(player.state().mapId());
            PlayerMotionState respawned = new PlayerMotionState(
                    spawn.mapId(), spawn.x(), spawn.y(), player.state().lastSequence());
            return player.withRespawn(respawned, PLAYER_MAX_HP, 0L, System.nanoTime());
        });

        players.values().stream().map(player -> player.state().mapId())
                .distinct().forEach(this::broadcast);
    }

    private void broadcast(String mapId) {
        var snapshots = players.values().stream()
                .filter(player -> mapId.equals(player.state().mapId()))
                .map(player -> Map.ofEntries(
                        Map.entry("playerId", player.playerId()),
                        Map.entry("mapId", player.state().mapId()),
                        Map.entry("x", player.state().x()),
                        Map.entry("y", player.state().y()),
                        Map.entry("sequence", player.state().lastSequence()),
                        Map.entry("hp", player.hp()),
                        Map.entry("maxHp", PLAYER_MAX_HP),
                        Map.entry("dead", player.hp() <= 0),
                        Map.entry("experience", player.experience()),
                        Map.entry("level", ExperienceProgression.levelFor(player.experience())),
                        Map.entry("inventory", player.inventory())))
                .toList();
        Map<String, Object> payload = Map.of(
                "type", "snapshot", "players", snapshots, "monsters", monsters.snapshot(mapId),
                "lootDrops", monsters.snapshotLoot(mapId));
        for (ConnectedPlayer player : players.values()) {
            if (mapId.equals(player.state().mapId()) && player.session().isOpen()) {
                try {
                    send(player.session(), payload);
                } catch (IOException ignored) {
                    // The websocket close lifecycle removes failed sessions.
                }
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
            String playerId,
            WebSocketSession session,
            PlayerMotionState state,
            long lastAcceptedNanos,
            int hp,
            long respawnAt,
            int experience,
            Map<String, Integer> inventory
    ) {
        private ConnectedPlayer {
            inventory = Map.copyOf(inventory);
        }

        private ConnectedPlayer withState(PlayerMotionState next, long acceptedAt) {
            return new ConnectedPlayer(playerId, session, next, acceptedAt,
                    hp, respawnAt, experience, inventory);
        }

        private ConnectedPlayer withVitals(int nextHp, long nextRespawnAt) {
            return new ConnectedPlayer(playerId, session, state, lastAcceptedNanos,
                    nextHp, nextRespawnAt, experience, inventory);
        }

        private ConnectedPlayer withRespawn(PlayerMotionState nextState, int nextHp,
                                             long nextRespawnAt, long acceptedAt) {
            return new ConnectedPlayer(playerId, session, nextState, acceptedAt,
                    nextHp, nextRespawnAt, experience, inventory);
        }

        private ConnectedPlayer withExperience(int nextExperience) {
            return new ConnectedPlayer(playerId, session, state, lastAcceptedNanos,
                    hp, respawnAt, nextExperience, inventory);
        }

        private ConnectedPlayer withLoot(List<LootDropState> drops) {
            Map<String, Integer> updated = new ConcurrentHashMap<>(inventory);
            drops.forEach(drop -> updated.merge(drop.itemCode(), drop.amount(), Integer::sum));
            return new ConnectedPlayer(playerId, session, state, lastAcceptedNanos,
                    hp, respawnAt, experience, updated);
        }
    }
}
