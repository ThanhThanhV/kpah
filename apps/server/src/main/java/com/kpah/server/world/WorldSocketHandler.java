package com.kpah.server.world;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.kpah.server.auth.AuthService;
import com.kpah.server.auth.SessionHandshakeInterceptor;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
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
    private static final long PLAYER_RESPAWN_MILLIS = 3_000L;
    private static final int MAX_MESSAGE_CHARACTERS = 8 * 1024;

    private final ObjectMapper mapper;
    private final MovementService movementService;
    private final StarterWorldRegistry worlds;
    private final MonsterSimulationService monsters;
    private final WorldCombatService combat;
    private final SkillCombatService skills;
    private final PlayerCharacterRepository characters;
    private final QuestService quests;
    private final ItemCatalog items;
    private final ClassCatalog classes;
    private final AuthService auth;
    private final WorldMessageRateLimiter messageRateLimiter;
    private final WorldNetworkMetrics networkMetrics;
    private final Map<String, ConnectedPlayer> players = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> sessionsByPlayerId = new ConcurrentHashMap<>();
    private final Map<String, WorldSpatialIndex<String>> playerSpatialIndexes = new ConcurrentHashMap<>();
    private final Set<String> pendingBroadcastMaps = ConcurrentHashMap.newKeySet();
    private final Map<String, Map<String, String>> lastSentEntityState = new ConcurrentHashMap<>();
    private final Map<String, String> lastSentMapBySession = new ConcurrentHashMap<>();
    private final Map<String, String> lastSentSelfState = new ConcurrentHashMap<>();
    private final Map<String, Long> lastMovementPersistAt = new ConcurrentHashMap<>();
    private static final long MOVEMENT_PERSIST_INTERVAL_MILLIS = 5_000L;
    private static final double INTEREST_RADIUS = 900.0;
    private static final double INTEREST_RADIUS_SQUARED = INTEREST_RADIUS * INTEREST_RADIUS;

    public WorldSocketHandler(ObjectMapper mapper, MovementService movementService,
                              StarterWorldRegistry worlds, MonsterSimulationService monsters, WorldCombatService combat,
                              SkillCombatService skills, PlayerCharacterRepository characters, QuestService quests,
                              ItemCatalog items, ClassCatalog classes, AuthService auth,
                              WorldMessageRateLimiter messageRateLimiter, WorldNetworkMetrics networkMetrics) {
        this.mapper = mapper;
        this.movementService = movementService;
        this.worlds = worlds;
        this.monsters = monsters;
        this.combat = combat;
        this.skills = skills;
        this.characters = characters;
        this.quests = quests;
        this.items = items;
        this.classes = classes;
        this.auth = auth;
        this.messageRateLimiter = messageRateLimiter;
        this.networkMetrics = networkMetrics;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String token = (String) session.getAttributes()
                .get(SessionHandshakeInterceptor.AUTH_TOKEN_ATTRIBUTE);
        AuthService.AuthPrincipal principal = auth.authenticate(token);
        if (principal == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Authentication required."));
            return;
        }

        String requestedCharacterId = UriComponentsBuilder.fromUri(session.getUri())
                .build().getQueryParams().getFirst("characterId");
        if (requestedCharacterId != null && !requestedCharacterId.isBlank()
                && !requestedCharacterId.equals(principal.characterId())) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Character does not belong to this account."));
            return;
        }

        PlayerCharacter character = characters.findById(principal.characterId()).orElse(null);
        if (character == null || !principal.accountId().equals(character.getAccountId())) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Character ownership could not be verified."));
            return;
        }
        String mapId = character.getMapId();
        PlayerMotionState initial = new PlayerMotionState(
                character.getMapId(), character.getX(), character.getY(), 0L);
        ConnectedPlayer player = new ConnectedPlayer(
                character.getId(), principal.accountId(), character.getName(), character.getClassCode(),
                session, initial, System.nanoTime(),
                character.getHp(),
                character.getHp() > 0 ? 0L : System.currentTimeMillis() + PLAYER_RESPAWN_MILLIS,
                character.getExperience(), character.getInventory(), character.getEquipment());
        skills.restore(player.playerId(), player.classCode(),
                ExperienceProgression.levelFor(player.experience()), character.getMana(), System.currentTimeMillis());
        players.put(session.getId(), player);
        sessionsByPlayerId.computeIfAbsent(player.playerId(), ignored -> ConcurrentHashMap.newKeySet())
                .add(session.getId());
        updatePlayerSpatialIndex(session.getId(), null, player);
        networkMetrics.connectionOpened(player.state().mapId());
        persist(player);
        lastMovementPersistAt.put(session.getId(), System.currentTimeMillis());
        send(session, Map.of("type", "welcome", "playerId", player.playerId(),
                "accountId", principal.accountId(), "mapId", mapId));
        broadcast(mapId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        ConnectedPlayer player = players.get(session.getId());
        if (player == null) return;
        String payload = message.getPayload();
        if (payload.length() > MAX_MESSAGE_CHARACTERS) {
            session.close(new CloseStatus(1009, "World message exceeds 8192 characters."));
            return;
        }
        try {
            JsonNode input = mapper.readTree(payload);
            if (input == null || !input.isObject()) {
                send(session, Map.of("type", "error", "message", "World message must be a JSON object."));
                return;
            }
            String type = input.path("type").isTextual() ? input.path("type").asText() : "";
            boolean rateLimited = !messageRateLimiter.tryAcquire(session.getId(), type);
            networkMetrics.recordInbound(type, rateLimited);
            if (rateLimited) return;
            if ("ping".equals(type)) {
                send(session, Map.of("type", "pong"));
            } else if ("move".equals(type)) {
                if (player.hp() <= 0) return;
                long sequence = requireLong(input, "sequence");
                double axisX = requireFiniteNumber(input, "axisX");
                double axisY = requireFiniteNumber(input, "axisY");
                long now = System.nanoTime();
                double elapsed = Math.min((now - player.lastAcceptedNanos()) / 1_000_000_000.0, 0.05);
                if (elapsed <= 0) elapsed = 0.001;
                String previousMapId = player.state().mapId();
                PlayerMotionState next = movementService.apply(
                        player.state(), new MovementInput(axisX, axisY, sequence), elapsed);
                double portalCheckX = next.x();
                double portalCheckY = next.y();
                PortalDefinition portal = worlds.require(next.mapId()).portals().stream()
                        .filter(candidate -> candidate.contains(portalCheckX, portalCheckY))
                        .findFirst().orElse(null);
                if (portal != null) {
                    WorldMapGeometry destination = worlds.require(portal.targetMapId());
                    if (portal.targetX() >= destination.width() || portal.targetY() >= destination.height()) {
                        throw new IllegalStateException("Portal destination is outside map " + destination.mapId());
                    }
                    next = new PlayerMotionState(destination.mapId(), portal.targetX(), portal.targetY(),
                            next.lastSequence());
                }
                ConnectedPlayer moved = player.withState(next, now);
                players.put(session.getId(), moved);
                updatePlayerSpatialIndex(session.getId(), previousMapId, moved);
                if (!previousMapId.equals(next.mapId())) {
                    networkMetrics.mapChanged(previousMapId, next.mapId());
                    persist(moved);
                    lastMovementPersistAt.put(session.getId(), System.currentTimeMillis());
                    send(session, Map.of("type", "map-transition", "mapId", next.mapId(),
                            "x", next.x(), "y", next.y()));
                    broadcast(previousMapId);
                } else {
                    persistMovementIfDue(session.getId(), moved);
                }
                broadcast(next.mapId());
            } else if ("attack".equals(type)) {
                if (player.hp() <= 0) {
                    send(session, Map.of("type", "error", "message", "You cannot attack while defeated."));
                    return;
                }
                String targetId = requireText(input, "targetMonsterId");
                MonsterAttackResult result = combat.basicAttack(
                        player.playerId(), player.state(), targetId, items.attackBonus(player.equipment()) + classes.attackBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())),
                        System.currentTimeMillis());
                if (!result.accepted()) {
                    send(session, Map.of("type", "error", "message", result.message()));
                } else {
                    if (result.monster().hp() == 0) {
                        players.computeIfPresent(session.getId(), (id, current) -> {
                            quests.onMonsterDefeated(current.playerId(), current.state().mapId(), result.monster().monsterType());
                            ConnectedPlayer rewarded = awardExperience(current, 25);
                            persist(rewarded);
                            return rewarded;
                        });
                    }
                    broadcastCombat(player.state().mapId(), Map.of("type", "combat", "action", "basic-attack",
                            "sourcePlayerId", player.playerId(), "targetMonsterId", targetId,
                            "damage", result.damage(), "monsterHp", result.monster().hp(),
                            "experienceReward", result.monster().hp() == 0 ? 25 : 0));
                    broadcast(player.state().mapId());
                }
            } else if ("equip".equals(type)) {
                String itemCode = requireText(input, "itemCode");
                ItemCatalog.ItemDefinition definition = items.requireEquipment(itemCode);
                int quantity = player.inventory().getOrDefault(itemCode, 0);
                if (quantity <= 0) throw new IllegalArgumentException("You do not own this item.");
                Map<String, Integer> inventory = new ConcurrentHashMap<>(player.inventory());
                inventory.compute(itemCode, (code, count) -> count == null || count <= 1 ? null : count - 1);
                Map<String, String> equipment = new ConcurrentHashMap<>(player.equipment());
                String replaced = equipment.put(definition.slot(), itemCode);
                if (replaced != null) {
                    ItemCatalog.InventoryUpdate returned = items.addToInventory(inventory, replaced, 1);
                    if (returned.acceptedAmount() != 1) {
                        throw new IllegalArgumentException("Inventory is full; cannot return the replaced equipment.");
                    }
                    inventory = new ConcurrentHashMap<>(returned.inventory());
                }
                ConnectedPlayer equipped = player.withInventoryAndEquipment(inventory, equipment);
                players.put(session.getId(), equipped);
                persist(equipped);
                send(session, Map.of("type", "equipment", "message", definition.name() + " equipped."));
                broadcast(player.state().mapId());
            } else if ("unequip".equals(type)) {
                String slot = requireText(input, "slot");
                Map<String, String> equipment = new ConcurrentHashMap<>(player.equipment());
                String removed = equipment.get(slot);
                if (removed == null) throw new IllegalArgumentException("Nothing is equipped in that slot.");
                ItemCatalog.InventoryUpdate returned = items.addToInventory(player.inventory(), removed, 1);
                if (returned.acceptedAmount() != 1) {
                    throw new IllegalArgumentException("Inventory is full; cannot unequip this item.");
                }
                equipment.remove(slot);
                Map<String, Integer> inventory = new ConcurrentHashMap<>(returned.inventory());
                ConnectedPlayer unequipped = player.withInventoryAndEquipment(inventory, equipment);
                players.put(session.getId(), unequipped);
                persist(unequipped);
                send(session, Map.of("type", "equipment", "message", "Item returned to inventory."));
                broadcast(player.state().mapId());
            } else if ("interact".equals(type)) {
                String npcId = requireText(input, "npcId");
                QuestService.QuestInteractionResult result = quests.interact(
                        player.playerId(), player.state().mapId(), npcId,
                        player.state().x(), player.state().y());
                if (result.experienceReward() > 0) {
                    players.computeIfPresent(session.getId(), (id, current) -> {
                        ConnectedPlayer rewarded = awardExperience(current, result.experienceReward());
                        persist(rewarded);
                        return rewarded;
                    });
                }
                send(session, result.toPayload());
                broadcast(player.state().mapId());
            } else if ("cast".equals(type)) {
                if (player.hp() <= 0) {
                    send(session, Map.of("type", "error", "message", "You cannot cast while defeated."));
                    return;
                }
                String skillId = requireText(input, "skillId");
                String targetId = requireText(input, "targetMonsterId");
                SkillCastResult result = skills.cast(player.playerId(), player.classCode(), player.state(), skillId,
                        targetId, items.attackBonus(player.equipment()) + classes.attackBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())),
                        ExperienceProgression.levelFor(player.experience()), System.currentTimeMillis());
                if (!result.accepted()) {
                    send(session, Map.of("type", "error", "message", result.message()));
                } else {
                    MonsterAttackResult attack = result.attack();
                    if (attack.monster().hp() == 0) {
                        players.computeIfPresent(session.getId(), (id, current) -> {
                            quests.onMonsterDefeated(current.playerId(), current.state().mapId(), attack.monster().monsterType());
                            ConnectedPlayer rewarded = awardExperience(current, 25);
                            persist(rewarded);
                            return rewarded;
                        });
                    }
                    persist(player);
                    broadcastCombat(player.state().mapId(), Map.ofEntries(
                            Map.entry("type", "combat"),
                            Map.entry("action", "skill-cast"),
                            Map.entry("sourcePlayerId", player.playerId()),
                            Map.entry("skillId", result.skill().skillId()),
                            Map.entry("skillName", result.skill().displayName()),
                            Map.entry("mana", result.manaRemaining()),
                            Map.entry("maxMana", skills.maxMana(player.classCode(), ExperienceProgression.levelFor(player.experience()))),
                            Map.entry("targetMonsterId", targetId),
                            Map.entry("damage", attack.damage()),
                            Map.entry("monsterHp", attack.monster().hp()),
                            Map.entry("experienceReward", attack.monster().hp() == 0 ? 25 : 0)));
                    broadcast(player.state().mapId());
                }
            } else {
                send(session, Map.of("type", "error", "message", "Unsupported message type."));
            }
        } catch (JsonProcessingException exception) {
            send(session, Map.of("type", "error", "message", "World message contains invalid JSON."));
        } catch (IllegalArgumentException exception) {
            send(session, Map.of("type", "error", "message", exception.getMessage()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        messageRateLimiter.remove(session.getId());
        ConnectedPlayer removed = players.remove(session.getId());
        if (removed != null) {
            Set<String> playerSessions = sessionsByPlayerId.get(removed.playerId());
            if (playerSessions != null) {
                playerSessions.remove(session.getId());
                if (playerSessions.isEmpty()) sessionsByPlayerId.remove(removed.playerId(), playerSessions);
            }
            removePlayerSpatialIndex(session.getId(), removed.state().mapId());
            networkMetrics.connectionClosed(removed.state().mapId());
        }
        lastMovementPersistAt.remove(session.getId());
        lastSentEntityState.remove(session.getId());
        lastSentMapBySession.remove(session.getId());
        lastSentSelfState.remove(session.getId());
        if (removed != null) {
            persist(removed);
            combat.removePlayer(removed.playerId());
            skills.removePlayer(removed.playerId());
            quests.evictSnapshot(removed.playerId());
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
            int[] appliedDamage = {0};
            Set<String> targetSessions = sessionsByPlayerId.get(attack.playerId());
            if (targetSessions == null) continue;
            for (String sessionId : targetSessions) {
                players.computeIfPresent(sessionId, (id, player) -> {
                    if (player.hp() <= 0) return player;
                    int mitigatedDamage = ItemCatalog.mitigateDamage(
                            attack.damage(), items.defenseBonus(player.equipment())
                                    + classes.defenseBonus(player.classCode(),
                                    ExperienceProgression.levelFor(player.experience())));
                    appliedDamage[0] = mitigatedDamage;
                    int hp = Math.max(0, player.hp() - mitigatedDamage);
                    long respawnAt = hp == 0 ? now + PLAYER_RESPAWN_MILLIS : 0L;
                    ConnectedPlayer damaged = player.withVitals(hp, respawnAt);
                    persist(damaged);
                    return damaged;
                });
            }
            if (appliedDamage[0] > 0) {
                ConnectedPlayer hitTarget = null;
                for (String sessionId : targetSessions) {
                    hitTarget = players.get(sessionId);
                    if (hitTarget != null) break;
                }
                if (hitTarget != null) {
                    broadcastCombat(hitTarget.state().mapId(), Map.of("type", "combat",
                            "action", attack.action(), "sourceMonsterId", attack.monsterId(),
                            "monsterName", attack.monsterName(), "targetPlayerId", attack.playerId(),
                            "damage", appliedDamage[0]));
                }
            }
        }

        for (Map.Entry<String, ConnectedPlayer> entry : players.entrySet()) {
            String sessionId = entry.getKey();
            ConnectedPlayer current = entry.getValue();
            if (current.hp() <= 0) continue;
            List<LootDropState> collected = monsters.collectNearbyLoot(
                    current.state().mapId(), current.state().x(), current.state().y());
            if (!collected.isEmpty()) {
                players.computeIfPresent(sessionId, (id, latest) -> {
                    Map<String, Integer> updatedInventory = new ConcurrentHashMap<>(latest.inventory());
                    for (LootDropState drop : collected) {
                        ItemCatalog.InventoryUpdate update = items.addToInventory(
                                updatedInventory, drop.itemCode(), drop.amount());
                        updatedInventory.clear();
                        updatedInventory.putAll(update.inventory());
                        int remainder = drop.amount() - update.acceptedAmount();
                        if (remainder > 0) monsters.restoreLoot(drop.withAmount(remainder));
                    }
                    ConnectedPlayer looted = latest.withInventory(updatedInventory);
                    persist(looted);
                    return looted;
                });
            }
        }

        players.replaceAll((sessionId, player) -> {
            if (player.hp() > 0 || player.respawnAt() == 0L || now < player.respawnAt()) return player;
            PlayerMotionState spawn = movementService.initialState(player.state().mapId());
            PlayerMotionState respawned = new PlayerMotionState(
                    spawn.mapId(), spawn.x(), spawn.y(), player.state().lastSequence());
            ConnectedPlayer revived = player.withRespawn(respawned, classes.maxHp(player.classCode(), ExperienceProgression.levelFor(player.experience())), 0L, System.nanoTime());
            updatePlayerSpatialIndex(sessionId, player.state().mapId(), revived);
            persist(revived);
            return revived;
        });

        players.values().stream().map(player -> player.state().mapId())
                .distinct().forEach(this::broadcast);
    }

    private ConnectedPlayer awardExperience(ConnectedPlayer player, int amount) {
        int nextExperience = player.experience() + Math.max(0, amount);
        int oldLevel = ExperienceProgression.levelFor(player.experience());
        int nextLevel = ExperienceProgression.levelFor(nextExperience);
        int hpIncrease = classes.maxHp(player.classCode(), nextLevel)
                - classes.maxHp(player.classCode(), oldLevel);
        return player.withExperience(nextExperience, hpIncrease);
    }

    private void persist(ConnectedPlayer player) {
        int level = ExperienceProgression.levelFor(player.experience());
        int mana = skills.manaFor(player.playerId(), player.classCode(), level, System.currentTimeMillis());
        characters.save(PlayerCharacter.from(player.accountId(), player.playerId(), player.characterName(), player.classCode(),
                player.state(), player.hp(), player.experience(), mana, player.inventory(), player.equipment()));
    }

    private void persistMovementIfDue(String sessionId, ConnectedPlayer player) {
        long now = System.currentTimeMillis();
        boolean[] due = {false};
        lastMovementPersistAt.compute(sessionId, (id, lastPersistAt) -> {
            if (lastPersistAt == null || now - lastPersistAt >= MOVEMENT_PERSIST_INTERVAL_MILLIS) {
                due[0] = true;
                return now;
            }
            return lastPersistAt;
        });
        if (due[0]) persist(player);
    }

    private void broadcast(String mapId) {
        if (mapId != null && !mapId.isBlank()) {
            pendingBroadcastMaps.add(mapId);
        }
    }

    @Scheduled(fixedRate = 50)
    public void flushPendingBroadcasts() {
        for (String mapId : pendingBroadcastMaps) {
            if (pendingBroadcastMaps.remove(mapId)) {
                broadcastNow(mapId);
            }
        }
    }

    private void broadcastNow(String mapId) {
        // Public player snapshots are materialized once, while player AOI membership
        // comes from the incrementally maintained per-map index.
        Map<String, Map<String, Object>> publicPlayersBySession = new HashMap<>();
        players.forEach((sessionId, player) -> {
            if (mapId.equals(player.state().mapId())) {
                publicPlayersBySession.put(sessionId, publicPlayerSnapshot(player));
            }
        });

        WorldSpatialIndex<String> playerIndex = playerSpatialIndexes.computeIfAbsent(
                mapId, ignored -> new WorldSpatialIndex<>());
        List<String> visiblePlayerSessions = new ArrayList<>();
        List<String> nearbyMonsterIds = new ArrayList<>();
        List<Map<String, Object>> visiblePlayers = new ArrayList<>();
        List<MonsterState> visibleMonsters = new ArrayList<>();
        List<LootDropState> visibleLoot = new ArrayList<>();
        for (Map.Entry<String, ConnectedPlayer> entry : players.entrySet()) {
            String sessionId = entry.getKey();
            ConnectedPlayer player = entry.getValue();
            if (!mapId.equals(player.state().mapId()) || !player.session().isOpen()) continue;
            double centerX = player.state().x();
            double centerY = player.state().y();
            visiblePlayerSessions.clear();
            visiblePlayers.clear();
            playerIndex.queryInto(centerX, centerY, INTEREST_RADIUS, visiblePlayerSessions);
            boolean ownPlayerVisible = false;
            for (String visibleSessionId : visiblePlayerSessions) {
                Map<String, Object> snapshot = publicPlayersBySession.get(visibleSessionId);
                if (snapshot != null) {
                    visiblePlayers.add(snapshot);
                    if (sessionId.equals(visibleSessionId)) ownPlayerVisible = true;
                }
            }
            Map<String, Object> ownSnapshot = publicPlayersBySession.get(sessionId);
            if (ownSnapshot != null && !ownPlayerVisible) visiblePlayers.add(ownSnapshot);
            monsters.nearbyMonsters(mapId, centerX, centerY, INTEREST_RADIUS,
                    visibleMonsters, nearbyMonsterIds);
            monsters.nearbyLoot(mapId, centerX, centerY, INTEREST_RADIUS, visibleLoot);
            Map<String, Object> selfState = new HashMap<>(quests.snapshotState(player.playerId()));
            selfState.put("inventory", player.inventory());
            selfState.put("equipment", player.equipment());
            selfState.put("itemCatalog", items.all());
            try {
                sendSnapshot(player, mapId, visiblePlayers, visibleMonsters, visibleLoot, selfState);
            } catch (IOException ignored) {
                // The websocket close lifecycle removes failed sessions.
            }
        }
    }

    private Map<String, Object> publicPlayerSnapshot(ConnectedPlayer player) {
        return Map.ofEntries(
                Map.entry("playerId", player.playerId()),
                Map.entry("name", player.characterName()),
                Map.entry("classCode", player.classCode()),
                Map.entry("mapId", player.state().mapId()),
                Map.entry("x", player.state().x()),
                Map.entry("y", player.state().y()),
                Map.entry("sequence", player.state().lastSequence()),
                Map.entry("hp", player.hp()),
                Map.entry("maxHp", classes.maxHp(player.classCode(), ExperienceProgression.levelFor(player.experience()))),
                Map.entry("dead", player.hp() <= 0),
                Map.entry("experience", player.experience()),
                Map.entry("level", ExperienceProgression.levelFor(player.experience())),
                Map.entry("classStats", Map.of(
                        "attack", classes.attackBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())),
                        "defense", classes.defenseBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())))),
                Map.entry("mana", skills.manaFor(player.playerId(), player.classCode(),
                        ExperienceProgression.levelFor(player.experience()), System.currentTimeMillis())),
                Map.entry("maxMana", skills.maxMana(player.classCode(), ExperienceProgression.levelFor(player.experience()))),
                Map.entry("skills", skills.skillsFor(player.classCode(), ExperienceProgression.levelFor(player.experience()))));
    }

    private void updatePlayerSpatialIndex(String sessionId, String previousMapId, ConnectedPlayer player) {
        String nextMapId = player.state().mapId();
        if (previousMapId != null && !previousMapId.equals(nextMapId)) {
            removePlayerSpatialIndex(sessionId, previousMapId);
        }
        playerSpatialIndexes.computeIfAbsent(nextMapId, ignored -> new WorldSpatialIndex<>())
                .upsert(sessionId, player.state().x(), player.state().y(), sessionId);
    }

    private void removePlayerSpatialIndex(String sessionId, String mapId) {
        WorldSpatialIndex<String> index = playerSpatialIndexes.get(mapId);
        if (index != null) index.remove(sessionId);
    }

    private void sendSnapshot(ConnectedPlayer recipient, String mapId,
                              List<Map<String, Object>> visiblePlayers,
                              List<MonsterState> visibleMonsters,
                              List<LootDropState> visibleLoot,
                              Map<String, Object> selfState) throws IOException {
        String sessionId = recipient.session().getId();
        Map<String, String> currentState = new HashMap<>();
        for (Map<String, Object> value : visiblePlayers) {
            currentState.put("p:" + value.get("playerId"), mapper.writeValueAsString(value));
        }
        for (MonsterState value : visibleMonsters) {
            currentState.put("m:" + value.monsterId(), mapper.writeValueAsString(value));
        }
        for (LootDropState value : visibleLoot) {
            currentState.put("l:" + value.dropId(), mapper.writeValueAsString(value));
        }

        String currentSelfState = mapper.writeValueAsString(selfState);
        String previousSelfState = lastSentSelfState.get(sessionId);
        Map<String, String> previousState = lastSentEntityState.get(sessionId);
        boolean fullSnapshot = previousState == null || !mapId.equals(lastSentMapBySession.get(sessionId));
        if (fullSnapshot) {
            send(recipient.session(), Map.of(
                    "type", "snapshot",
                    "players", visiblePlayers,
                    "selfState", selfState,
                    "monsters", visibleMonsters,
                    "lootDrops", visibleLoot));
        } else {
            List<Map<String, Object>> changedPlayers = visiblePlayers.stream()
                    .filter(value -> !java.util.Objects.equals(previousState.get("p:" + value.get("playerId")),
                            currentState.get("p:" + value.get("playerId"))))
                    .toList();
            List<MonsterState> changedMonsters = visibleMonsters.stream()
                    .filter(value -> !java.util.Objects.equals(previousState.get("m:" + value.monsterId()),
                            currentState.get("m:" + value.monsterId())))
                    .toList();
            List<LootDropState> changedLoot = visibleLoot.stream()
                    .filter(value -> !java.util.Objects.equals(previousState.get("l:" + value.dropId()),
                            currentState.get("l:" + value.dropId())))
                    .toList();
            List<String> removedPlayers = previousState.keySet().stream()
                    .filter(key -> key.startsWith("p:") && !currentState.containsKey(key))
                    .map(key -> key.substring(2)).toList();
            List<String> removedMonsters = previousState.keySet().stream()
                    .filter(key -> key.startsWith("m:") && !currentState.containsKey(key))
                    .map(key -> key.substring(2)).toList();
            List<String> removedLoot = previousState.keySet().stream()
                    .filter(key -> key.startsWith("l:") && !currentState.containsKey(key))
                    .map(key -> key.substring(2)).toList();

            Map<String, Object> delta = new HashMap<>();
            delta.put("type", "snapshot-delta");
            delta.put("players", changedPlayers);
            delta.put("removedPlayerIds", removedPlayers);
            delta.put("monsters", changedMonsters);
            delta.put("removedMonsterIds", removedMonsters);
            delta.put("lootDrops", changedLoot);
            delta.put("removedLootDropIds", removedLoot);
            if (!java.util.Objects.equals(previousSelfState, currentSelfState)) {
                delta.put("selfState", selfState);
            }
            send(recipient.session(), delta);
        }
        // Advance baselines only after send() completes successfully.
        lastSentEntityState.put(sessionId, currentState);
        lastSentMapBySession.put(sessionId, mapId);
        lastSentSelfState.put(sessionId, currentSelfState);
    }

    private boolean isWithinInterest(double centerX, double centerY, double x, double y) {
        double deltaX = x - centerX;
        double deltaY = y - centerY;
        return deltaX * deltaX + deltaY * deltaY <= INTEREST_RADIUS_SQUARED;
    }

    private void broadcastCombat(String mapId, Object payload) {
        Map<?, ?> event = payload instanceof Map<?, ?> values ? values : Map.of();
        String sourcePlayerId = event.get("sourcePlayerId") instanceof String value ? value : null;
        String targetPlayerId = event.get("targetPlayerId") instanceof String value ? value : null;
        String anchorPlayerId = sourcePlayerId != null ? sourcePlayerId : targetPlayerId;
        ConnectedPlayer anchor = anchorPlayerId == null ? null : players.values().stream()
                .filter(candidate -> anchorPlayerId.equals(candidate.playerId()))
                .filter(candidate -> mapId.equals(candidate.state().mapId()))
                .findFirst().orElse(null);

        for (ConnectedPlayer player : players.values()) {
            if (!mapId.equals(player.state().mapId()) || !player.session().isOpen()) continue;
            boolean participant = player.playerId().equals(sourcePlayerId)
                    || player.playerId().equals(targetPlayerId);
            boolean nearby = anchor == null || isWithinInterest(
                    player.state().x(), player.state().y(),
                    anchor.state().x(), anchor.state().y());
            if (!participant && !nearby) continue;
            try {
                send(player.session(), payload);
            } catch (IOException ignored) {
                // The websocket close lifecycle removes failed sessions.
            }
        }
    }

    private String requireText(JsonNode input, String field) {
        JsonNode value = input.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank() || value.asText().length() > 128) {
            throw new IllegalArgumentException(field + " must be a non-empty string of at most 128 characters.");
        }
        return value.asText();
    }

    private long requireLong(JsonNode input, String field) {
        JsonNode value = input.get(field);
        if (value == null || !value.isIntegralNumber() || !value.canConvertToLong()) {
            throw new IllegalArgumentException(field + " must be an integer.");
        }
        return value.longValue();
    }

    private double requireFiniteNumber(JsonNode input, String field) {
        JsonNode value = input.get(field);
        if (value == null || !value.isNumber() || !Double.isFinite(value.doubleValue())) {
            throw new IllegalArgumentException(field + " must be a finite number.");
        }
        return value.doubleValue();
    }

    private void send(WebSocketSession session, Object payload) throws IOException {
        if (!session.isOpen()) return;
        String messageType = payload instanceof Map<?, ?> values && values.get("type") instanceof String type
                ? type : "unknown";
        long startedAt = System.nanoTime();
        int payloadBytes = 0;
        try {
            String serialized = mapper.writeValueAsString(payload);
            payloadBytes = serialized.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
            synchronized (session) {
                if (!session.isOpen()) return;
                session.sendMessage(new TextMessage(serialized));
            }
            networkMetrics.recordSend(messageType, payloadBytes, System.nanoTime() - startedAt, true);
        } catch (IOException | RuntimeException exception) {
            networkMetrics.recordSend(messageType, payloadBytes, System.nanoTime() - startedAt, false);
            throw exception;
        }
    }

    private record ConnectedPlayer(
            String playerId,
            String accountId,
            String characterName,
            String classCode,
            WebSocketSession session,
            PlayerMotionState state,
            long lastAcceptedNanos,
            int hp,
            long respawnAt,
            int experience,
            Map<String, Integer> inventory,
            Map<String, String> equipment
    ) {
        private ConnectedPlayer {
            inventory = Map.copyOf(inventory);
            equipment = Map.copyOf(equipment);
        }

        private ConnectedPlayer withState(PlayerMotionState next, long acceptedAt) {
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, next, acceptedAt,
                    hp, respawnAt, experience, inventory, equipment);
        }

        private ConnectedPlayer withVitals(int nextHp, long nextRespawnAt) {
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, state, lastAcceptedNanos,
                    nextHp, nextRespawnAt, experience, inventory, equipment);
        }

        private ConnectedPlayer withRespawn(PlayerMotionState nextState, int nextHp,
                                             long nextRespawnAt, long acceptedAt) {
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, nextState, acceptedAt,
                    nextHp, nextRespawnAt, experience, inventory, equipment);
        }

        private ConnectedPlayer withExperience(int nextExperience, int levelHpIncrease) {
            int nextHp = hp > 0 ? hp + Math.max(0, levelHpIncrease) : hp;
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, state, lastAcceptedNanos,
                    nextHp, respawnAt, nextExperience, inventory, equipment);
        }

        private ConnectedPlayer withLoot(List<LootDropState> drops) {
            Map<String, Integer> updated = new ConcurrentHashMap<>(inventory);
            drops.forEach(drop -> updated.merge(drop.itemCode(), drop.amount(), Integer::sum));
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, state, lastAcceptedNanos,
                    hp, respawnAt, experience, updated, equipment);
        }

        private ConnectedPlayer withInventory(Map<String, Integer> nextInventory) {
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, state, lastAcceptedNanos,
                    hp, respawnAt, experience, nextInventory, equipment);
        }

        private ConnectedPlayer withInventoryAndEquipment(Map<String, Integer> nextInventory,
                                                           Map<String, String> nextEquipment) {
            return new ConnectedPlayer(playerId, accountId, characterName, classCode, session, state, lastAcceptedNanos,
                    hp, respawnAt, experience, nextInventory, nextEquipment);
        }
    }}
