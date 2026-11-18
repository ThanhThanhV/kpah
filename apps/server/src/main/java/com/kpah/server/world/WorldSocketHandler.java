package com.kpah.server.world;

import com.fasterxml.jackson.databind.JsonNode;
import com.kpah.server.auth.AuthService;
import com.kpah.server.auth.SessionHandshakeInterceptor;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
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

    private final ObjectMapper mapper;
    private final MovementService movementService;
    private final MonsterSimulationService monsters;
    private final WorldCombatService combat;
    private final SkillCombatService skills;
    private final PlayerCharacterRepository characters;
    private final QuestService quests;
    private final ItemCatalog items;
    private final ClassCatalog classes;
    private final AuthService auth;
    private final WorldMessageRateLimiter messageRateLimiter;
    private final Map<String, ConnectedPlayer> players = new ConcurrentHashMap<>();

    public WorldSocketHandler(ObjectMapper mapper, MovementService movementService,
                              MonsterSimulationService monsters, WorldCombatService combat,
                              SkillCombatService skills, PlayerCharacterRepository characters, QuestService quests,
                              ItemCatalog items, ClassCatalog classes, AuthService auth,
                              WorldMessageRateLimiter messageRateLimiter) {
        this.mapper = mapper;
        this.movementService = movementService;
        this.monsters = monsters;
        this.combat = combat;
        this.skills = skills;
        this.characters = characters;
        this.quests = quests;
        this.items = items;
        this.classes = classes;
        this.auth = auth;
        this.messageRateLimiter = messageRateLimiter;
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
        persist(player);
        send(session, Map.of("type", "welcome", "playerId", player.playerId(),
                "accountId", principal.accountId(), "mapId", mapId));
        broadcast(mapId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        ConnectedPlayer player = players.get(session.getId());
        if (player == null) return;
        try {
            JsonNode input = mapper.readTree(message.getPayload());
            String type = input.path("type").asText();
            if (!messageRateLimiter.tryAcquire(session.getId(), type)) return;
            if ("ping".equals(type)) {
                send(session, Map.of("type", "pong"));
            } else if ("move".equals(type)) {
                if (player.hp() <= 0) return;
                long sequence = input.path("sequence").asLong(-1);
                double axisX = input.path("axisX").asDouble(Double.NaN);
                double axisY = input.path("axisY").asDouble(Double.NaN);
                long now = System.nanoTime();
                double elapsed = Math.min((now - player.lastAcceptedNanos()) / 1_000_000_000.0, 0.05);
                if (elapsed <= 0) elapsed = 0.001;
                PlayerMotionState next = movementService.apply(
                        player.state(), new MovementInput(axisX, axisY, sequence), elapsed);
                ConnectedPlayer moved = player.withState(next, now);
                players.put(session.getId(), moved);
                persist(moved);
                broadcast(next.mapId());
            } else if ("attack".equals(type)) {
                if (player.hp() <= 0) {
                    send(session, Map.of("type", "error", "message", "You cannot attack while defeated."));
                    return;
                }
                String targetId = input.path("targetMonsterId").asText("");
                MonsterAttackResult result = combat.basicAttack(
                        player.playerId(), player.state(), targetId, items.attackBonus(player.equipment()) + classes.attackBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())),
                        System.currentTimeMillis());
                if (!result.accepted()) {
                    send(session, Map.of("type", "error", "message", result.message()));
                } else {
                    if (result.monster().hp() == 0) {
                        players.computeIfPresent(session.getId(), (id, current) -> {
                            quests.onMonsterDefeated(current.playerId(), result.monster().monsterType());
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
                String itemCode = input.path("itemCode").asText("");
                ItemCatalog.ItemDefinition definition = items.requireEquipment(itemCode);
                int quantity = player.inventory().getOrDefault(itemCode, 0);
                if (quantity <= 0) throw new IllegalArgumentException("You do not own this item.");
                Map<String, Integer> inventory = new ConcurrentHashMap<>(player.inventory());
                inventory.compute(itemCode, (code, count) -> count == null || count <= 1 ? null : count - 1);
                Map<String, String> equipment = new ConcurrentHashMap<>(player.equipment());
                String replaced = equipment.put(definition.slot(), itemCode);
                if (replaced != null) inventory.merge(replaced, 1, Integer::sum);
                ConnectedPlayer equipped = player.withInventoryAndEquipment(inventory, equipment);
                players.put(session.getId(), equipped);
                persist(equipped);
                send(session, Map.of("type", "equipment", "message", definition.name() + " equipped."));
                broadcast(player.state().mapId());
            } else if ("unequip".equals(type)) {
                String slot = input.path("slot").asText("");
                Map<String, String> equipment = new ConcurrentHashMap<>(player.equipment());
                String removed = equipment.remove(slot);
                if (removed == null) throw new IllegalArgumentException("Nothing is equipped in that slot.");
                Map<String, Integer> inventory = new ConcurrentHashMap<>(player.inventory());
                inventory.merge(removed, 1, Integer::sum);
                ConnectedPlayer unequipped = player.withInventoryAndEquipment(inventory, equipment);
                players.put(session.getId(), unequipped);
                persist(unequipped);
                send(session, Map.of("type", "equipment", "message", "Item returned to inventory."));
                broadcast(player.state().mapId());
            } else if ("interact".equals(type)) {
                String npcId = input.path("npcId").asText("");
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
                String skillId = input.path("skillId").asText("");
                String targetId = input.path("targetMonsterId").asText("");
                SkillCastResult result = skills.cast(player.playerId(), player.classCode(), player.state(), skillId,
                        targetId, items.attackBonus(player.equipment()) + classes.attackBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())),
                        ExperienceProgression.levelFor(player.experience()), System.currentTimeMillis());
                if (!result.accepted()) {
                    send(session, Map.of("type", "error", "message", result.message()));
                } else {
                    MonsterAttackResult attack = result.attack();
                    if (attack.monster().hp() == 0) {
                        players.computeIfPresent(session.getId(), (id, current) -> {
                            quests.onMonsterDefeated(current.playerId(), attack.monster().monsterType());
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
        } catch (IllegalArgumentException exception) {
            send(session, Map.of("type", "error", "message", exception.getMessage()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        messageRateLimiter.remove(session.getId());
        ConnectedPlayer removed = players.remove(session.getId());
        if (removed != null) {
            persist(removed);
            combat.removePlayer(removed.playerId());
            skills.removePlayer(removed.playerId());
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
            players.replaceAll((sessionId, player) -> {
                if (!player.playerId().equals(attack.playerId()) || player.hp() <= 0) return player;
                int mitigatedDamage = ItemCatalog.mitigateDamage(
                        attack.damage(), items.defenseBonus(player.equipment()) + classes.defenseBonus(player.classCode(), ExperienceProgression.levelFor(player.experience())));
                appliedDamage[0] = mitigatedDamage;
                int hp = Math.max(0, player.hp() - mitigatedDamage);
                long respawnAt = hp == 0 ? now + PLAYER_RESPAWN_MILLIS : 0L;
                ConnectedPlayer damaged = player.withVitals(hp, respawnAt);
                persist(damaged);
                return damaged;
            });
            if (appliedDamage[0] > 0) {
                ConnectedPlayer hitTarget = players.values().stream()
                        .filter(player -> player.playerId().equals(attack.playerId())).findFirst().orElse(null);
                if (hitTarget != null) {
                    broadcastCombat(hitTarget.state().mapId(), Map.of("type", "combat",
                            "action", "player-hit", "targetPlayerId", attack.playerId(),
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

    private void broadcast(String mapId) {
        var snapshots = players.values().stream()
                .filter(player -> mapId.equals(player.state().mapId()))
                .map(player -> Map.ofEntries(
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
                        Map.entry("mana", skills.manaFor(player.playerId(), player.classCode(), ExperienceProgression.levelFor(player.experience()), System.currentTimeMillis())),
                        Map.entry("maxMana", skills.maxMana(player.classCode(), ExperienceProgression.levelFor(player.experience()))),
                        Map.entry("skills", skills.skillsFor(player.classCode(), ExperienceProgression.levelFor(player.experience()))),
                        Map.entry("inventory", player.inventory()),
                        Map.entry("equipment", player.equipment()),
                        Map.entry("itemCatalog", items.all()),
                        Map.entry("quest", quests.snapshot(player.playerId()))))
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

    private void broadcastCombat(String mapId, Object payload) {
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
