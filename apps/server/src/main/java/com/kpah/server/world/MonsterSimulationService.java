package com.kpah.server.world;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;

@Service
public class MonsterSimulationService {
    private static final int BASIC_ATTACK_DAMAGE = 20;
    private static final double BASIC_ATTACK_RANGE = 58.0;
    private static final long IDLE_AI_INTERVAL_MILLIS = 300L;

    private final Map<String, List<MonsterSpawnRegion>> regionsByMap = new ConcurrentHashMap<>();
    private final Map<String, GridPathfinder> pathfindersByMap = new ConcurrentHashMap<>();
    private final Map<String, MonsterRuntime> monsters = new ConcurrentHashMap<>();
    private final Map<String, WorldSpatialIndex<String>> monsterSpatialIndexes = new ConcurrentHashMap<>();
    private final Map<String, WorldSpatialIndex<MonsterTarget>> playerTargetSpatialIndexes = new ConcurrentHashMap<>();
    private final Map<String, MonsterTarget> playerTargetsById = new HashMap<>();
    private final Set<String> activePlayerTargetIds = new HashSet<>();
    private final Map<String, Map<String, Long>> nextSpawnAt = new ConcurrentHashMap<>();
    private final Map<String, Map<String, AtomicInteger>> aliveCountsByMap = new ConcurrentHashMap<>();
    private final Map<String, LootDropState> lootDrops = new ConcurrentHashMap<>();
    private final PriorityBlockingQueue<ExpiringLootDrop> lootExpiryQueue = new PriorityBlockingQueue<>();
    private final Map<String, WorldSpatialIndex<LootDropState>> lootSpatialIndexes = new ConcurrentHashMap<>();
    private final MonsterDropTable dropTable;
    private final MonsterArchetypeRegistry archetypes;

    public MonsterSimulationService(StarterWorldRegistry worlds, MonsterDropTable dropTable,
                                    MonsterArchetypeRegistry archetypes) {
        this.dropTable = dropTable;
        this.archetypes = archetypes;
        for (WorldMapGeometry map : worlds.all()) {
            regionsByMap.put(map.mapId(), map.monsterSpawns());
            pathfindersByMap.put(map.mapId(), new GridPathfinder(map));
            Map<String, Long> schedules = new ConcurrentHashMap<>();
            nextSpawnAt.put(map.mapId(), schedules);
            Map<String, AtomicInteger> aliveCounts = new ConcurrentHashMap<>();
            aliveCountsByMap.put(map.mapId(), aliveCounts);
            for (MonsterSpawnRegion region : map.monsterSpawns()) {
                aliveCounts.put(region.id(), new AtomicInteger());
                archetypes.require(region.monsterType());
                for (int i = 0; i < region.maxAlive(); i++) spawn(map.mapId(), region, i);
                schedules.put(region.id(), 0L);
            }
        }
    }

    public synchronized List<MonsterPlayerAttack> advance(long nowMillis, Collection<MonsterTarget> players) {
        List<MonsterPlayerAttack> attacks = new ArrayList<>();
        activePlayerTargetIds.clear();
        for (MonsterTarget player : players) {
            activePlayerTargetIds.add(player.playerId());
            MonsterTarget previous = playerTargetsById.put(player.playerId(), player);
            if (previous != null && !previous.mapId().equals(player.mapId())) {
                WorldSpatialIndex<MonsterTarget> previousIndex = playerTargetSpatialIndexes.get(previous.mapId());
                if (previousIndex != null) previousIndex.remove(player.playerId());
            }
            if (!player.equals(previous)) {
                playerTargetSpatialIndexes.computeIfAbsent(player.mapId(), ignored -> new WorldSpatialIndex<>())
                        .upsert(player.playerId(), player.x(), player.y(), player);
            }
        }
        Iterator<Map.Entry<String, MonsterTarget>> playerIterator = playerTargetsById.entrySet().iterator();
        while (playerIterator.hasNext()) {
            Map.Entry<String, MonsterTarget> playerEntry = playerIterator.next();
            if (!activePlayerTargetIds.contains(playerEntry.getKey())) {
                WorldSpatialIndex<MonsterTarget> index =
                        playerTargetSpatialIndexes.get(playerEntry.getValue().mapId());
                if (index != null) index.remove(playerEntry.getKey());
                playerIterator.remove();
            }
        }
        for (Map.Entry<String, List<MonsterSpawnRegion>> entry : regionsByMap.entrySet()) {
            String mapId = entry.getKey();
            for (MonsterSpawnRegion region : entry.getValue()) {
                long next = nextSpawnAt.get(mapId).getOrDefault(region.id(), 0L);
                int alive = aliveCountsByMap.get(mapId).get(region.id()).get();
                if (alive < region.maxAlive() && nowMillis >= next) {
                    spawn(mapId, region, alive);
                    nextSpawnAt.get(mapId).put(region.id(), nowMillis + region.respawnMillis());
                }
            }
        }

        ExpiringLootDrop expired;
        while ((expired = lootExpiryQueue.peek()) != null && expired.expiresAt() <= nowMillis) {
            lootExpiryQueue.poll();
            LootDropState drop = lootDrops.get(expired.dropId());
            if (drop != null && drop.createdAt() == expired.createdAt()
                    && lootDrops.remove(drop.dropId(), drop)) {
                lootSpatialIndexes.computeIfAbsent(drop.mapId(), ignored -> new WorldSpatialIndex<>())
                        .remove(drop.dropId());
            }
        }
        List<MonsterTarget> nearbyPlayers = new ArrayList<>();
        for (MonsterRuntime monster : monsters.values()) {
            if (monster.hp <= 0) {
                if (nowMillis >= monster.respawnAt && monsters.remove(monster.id, monster)) {
                    monsterSpatialIndexes.computeIfAbsent(monster.mapId, ignored -> new WorldSpatialIndex<>())
                            .remove(monster.id);
                }
                continue;
            }
            nearbyPlayers.clear();
            WorldSpatialIndex<MonsterTarget> playerIndex = playerTargetSpatialIndexes.get(monster.mapId);
            if (playerIndex != null) {
                playerIndex.queryInto(monster.x, monster.y, monster.archetype.aggroRange(), nearbyPlayers);
            }
            attacks.addAll(monster.advance(nowMillis, players, nearbyPlayers));
            if (monster.hp > 0) {
                if (monster.x != monster.indexedX || monster.y != monster.indexedY) {
                    monsterSpatialIndexes.computeIfAbsent(monster.mapId, ignored -> new WorldSpatialIndex<>())
                            .upsert(monster.id, monster.x, monster.y, monster.id);
                    monster.indexedX = monster.x;
                    monster.indexedY = monster.y;
                }
            } else {
                monsterSpatialIndexes.computeIfAbsent(monster.mapId, ignored -> new WorldSpatialIndex<>())
                        .remove(monster.id);
            }
        }
        return attacks;
    }

    public void provoke(String monsterId, String playerId, long nowMillis) {
        MonsterRuntime monster = monsters.get(monsterId);
        if (monster == null || monster.hp <= 0 || playerId == null || playerId.isBlank()) return;
        synchronized (monster) {
            if (monster.archetype.behavior() == MonsterBehavior.DEFENSIVE) {
                monster.provokedPlayerId = playerId;
                monster.provokedUntil = nowMillis + 8_000L;
            }
        }
    }

    public MonsterAttackResult applyBasicAttack(String mapId, double attackerX, double attackerY,
                                                String monsterId, int attackBonus, long nowMillis) {
        return applyDamage(mapId, attackerX, attackerY, monsterId,
                BASIC_ATTACK_DAMAGE + Math.max(0, attackBonus), BASIC_ATTACK_RANGE, nowMillis);
    }

    public MonsterAttackResult applySkillAttack(String mapId, double attackerX, double attackerY,
                                                String monsterId, int damage, double range, long nowMillis) {
        if (damage <= 0 || !Double.isFinite(range) || range <= 0) {
            return MonsterAttackResult.rejected("Invalid skill combat parameters.");
        }
        return applyDamage(mapId, attackerX, attackerY, monsterId, damage, range, nowMillis);
    }

    private MonsterAttackResult applyDamage(String mapId, double attackerX, double attackerY,
                                            String monsterId, int damage, double range, long nowMillis) {
        MonsterRuntime monster = monsters.get(monsterId);
        if (monster == null || !monster.mapId.equals(mapId) || monster.hp <= 0) {
            return MonsterAttackResult.rejected("Target is no longer available.");
        }
        double distance = Math.hypot(monster.x - attackerX, monster.y - attackerY);
        if (distance > range) return MonsterAttackResult.rejected("Target is out of attack range.");
        synchronized (monster) {
            if (monster.hp <= 0) return MonsterAttackResult.rejected("Target is already defeated.");
            int appliedDamage = Math.min(damage, monster.hp);
            monster.hp -= appliedDamage;
            if (monster.hp == 0) {
                aliveCountsByMap.get(mapId).get(monster.region.id()).decrementAndGet();
                long respawnAt = nowMillis + monster.region.respawnMillis();
                monster.respawnAt = respawnAt;
                nextSpawnAt.get(mapId).put(monster.region.id(), respawnAt);
                for (MonsterDropTable.RolledDrop rolled : dropTable.roll(
                        mapId, monster.region.monsterType(), ThreadLocalRandom.current())) {
                    LootDropState drop = new LootDropState(UUID.randomUUID().toString(),
                            rolled.itemCode(), rolled.amount(), mapId, monster.x, monster.y, nowMillis);
                    addLoot(drop);
                }
            }
            return new MonsterAttackResult(true, "Hit", monster.snapshot(), appliedDamage);
        }
    }

    public List<MonsterState> snapshot(String mapId) {
        return monsters.values().stream()
                .filter(monster -> monster.mapId.equals(mapId) && monster.hp > 0)
                .map(MonsterRuntime::snapshot).toList();
    }

    public List<LootDropState> snapshotLoot(String mapId) {
        return lootDrops.values().stream()
                .filter(drop -> drop.mapId().equals(mapId)).toList();
    }

    public List<MonsterState> nearbyMonsters(String mapId, double x, double y, double radius) {
        List<MonsterState> result = new ArrayList<>();
        nearbyMonsters(mapId, x, y, radius, result, new ArrayList<>());
        return result;
    }

    public void nearbyMonsters(String mapId, double x, double y, double radius,
                               List<MonsterState> result, List<String> candidateIds) {
        result.clear();
        candidateIds.clear();
        WorldSpatialIndex<String> index = monsterSpatialIndexes.get(mapId);
        if (index == null) return;
        index.queryInto(x, y, radius, candidateIds);
        for (String monsterId : candidateIds) {
            MonsterRuntime monster = monsters.get(monsterId);
            if (monster == null || monster.hp <= 0 || !mapId.equals(monster.mapId)) continue;
            if (Math.hypot(monster.x - x, monster.y - y) <= radius) {
                result.add(monster.snapshot());
            }
        }
    }

    public List<LootDropState> nearbyLoot(String mapId, double x, double y, double radius) {
        List<LootDropState> result = new ArrayList<>();
        nearbyLoot(mapId, x, y, radius, result);
        return result;
    }

    public void nearbyLoot(String mapId, double x, double y, double radius, List<LootDropState> result) {
        result.clear();
        WorldSpatialIndex<LootDropState> index = lootSpatialIndexes.get(mapId);
        if (index != null) index.queryInto(x, y, radius, result);
    }

    public void restoreLoot(LootDropState drop) {
        if (drop != null && drop.amount() > 0) addLoot(drop);
    }

    public List<LootDropState> collectNearbyLoot(String mapId, double x, double y) {
        WorldSpatialIndex<LootDropState> index = lootSpatialIndexes.get(mapId);
        if (index == null) return List.of();
        List<LootDropState> collected = new ArrayList<>();
        for (LootDropState drop : index.query(x, y, 38.0)) {
            if (lootDrops.remove(drop.dropId(), drop)) {
                index.remove(drop.dropId());
                collected.add(drop);
            }
        }
        return List.copyOf(collected);
    }

    private void addLoot(LootDropState drop) {
        LootDropState previous = lootDrops.putIfAbsent(drop.dropId(), drop);
        if (previous == null) {
            lootSpatialIndexes.computeIfAbsent(drop.mapId(), ignored -> new WorldSpatialIndex<>())
                    .upsert(drop.dropId(), drop.x(), drop.y(), drop);
            lootExpiryQueue.add(new ExpiringLootDrop(
                    drop.dropId(), drop.createdAt(), drop.createdAt() + 300_001L));
        }
    }

    private void spawn(String mapId, MonsterSpawnRegion region, int ordinal) {
        String id = UUID.randomUUID().toString();
        double offsetX = region.maxAlive() <= 1 ? 0
                : ((ordinal % region.maxAlive()) - (region.maxAlive() - 1) / 2.0) * 18.0;
        double offsetY = (ordinal % 2 == 0 ? -1 : 1) * 12.0;
        double homeX = clamp(region.centerX() + offsetX, region.x(), region.x() + region.width());
        double homeY = clamp(region.centerY() + offsetY, region.y(), region.y() + region.height());
        MonsterRuntime monster = new MonsterRuntime(id, mapId, region, archetypes.require(region.monsterType()),
                homeX, homeY, pathfindersByMap.get(mapId));
        monsters.put(id, monster);
        aliveCountsByMap.get(mapId).get(region.id()).incrementAndGet();
        monsterSpatialIndexes.computeIfAbsent(mapId, ignored -> new WorldSpatialIndex<>())
                .upsert(id, homeX, homeY, id);
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static final class MonsterRuntime {
        private final String id;
        private final String mapId;
        private final MonsterSpawnRegion region;
        private final MonsterArchetype archetype;
        private final double homeX;
        private final double homeY;
        private final GridPathfinder pathfinder;
        private List<GridPathfinder.Waypoint> path = List.of();
        private int pathIndex;
        private long nextPathAt;
        private long nextIdleAiAt;
        private long lastMovementUpdateAt = -1L;
        private int pathTargetCellX = Integer.MIN_VALUE;
        private int pathTargetCellY = Integer.MIN_VALUE;
        private boolean pathCalculated;
        private final long phase = System.nanoTime() / 1_000_000L;
        private volatile double x;
        private volatile double y;
        private double indexedX;
        private double indexedY;
        private volatile int hp;
        private volatile long respawnAt = Long.MAX_VALUE;
        private volatile long nextAttackAt;
        private volatile String targetPlayerId;
        private int attacksPerformed;
        private volatile String provokedPlayerId;
        private volatile long provokedUntil;
        private volatile String state = "idle";
        private long heavyStrikeUntil;
        private double heavyStrikeX;
        private double heavyStrikeY;
        private double heavyStrikeWidth;
        private double heavyStrikeHeight;
        private double heavyStrikeAngle;
        private String heavyStrikeShape = "";
        private static final long HEAVY_STRIKE_WINDUP_MILLIS = 1_000L;
        private static final double HEAVY_STRIKE_RADIUS = 92.0;
        private static final double HEAVY_STRIKE_SWEEP_WIDTH = 184.0;
        private static final double HEAVY_STRIKE_SWEEP_HEIGHT = 64.0;

        private MonsterRuntime(String id, String mapId, MonsterSpawnRegion region, MonsterArchetype archetype,
                               double homeX, double homeY, GridPathfinder pathfinder) {
            this.id = id; this.mapId = mapId; this.region = region; this.archetype = archetype;
            this.pathfinder = pathfinder; this.hp = archetype.maxHp();
            this.homeX = homeX; this.homeY = homeY; this.x = homeX; this.y = homeY;
            this.indexedX = homeX; this.indexedY = homeY;
        }

        private List<MonsterPlayerAttack> advance(long nowMillis, Collection<MonsterTarget> players,
                                                   Collection<MonsterTarget> nearbyPlayers) {
            if (heavyStrikeUntil > 0) {
                if (nowMillis < heavyStrikeUntil) {
                    state = "windup";
                    return List.of();
                }
                heavyStrikeUntil = 0;
                state = "attack";
                int damage = (int) Math.ceil(archetype.attackDamage() * 1.8);
                return players.stream()
                        .filter(player -> mapId.equals(player.mapId()))
                        .filter(this::insideHeavyStrike)
                        .map(player -> new MonsterPlayerAttack(player.playerId(), id,
                                archetype.displayName(), damage, "monster-special"))
                        .toList();
            }

            MonsterTarget target = switch (archetype.behavior()) {
                case PATROL -> null;
                case DEFENSIVE -> {
                    if (nowMillis > provokedUntil) {
                        provokedPlayerId = null;
                        yield null;
                    }
                    yield nearbyPlayers.stream()
                            .filter(player -> mapId.equals(player.mapId()))
                            .filter(player -> player.playerId().equals(provokedPlayerId))
                            .filter(player -> distance(player.x(), player.y(), x, y) <= archetype.aggroRange())
                            .findFirst().orElse(null);
                }
                case AGGRESSIVE, ELITE -> nearbyPlayers.stream()
                        .filter(player -> mapId.equals(player.mapId()))
                        .filter(player -> distance(player.x(), player.y(), x, y) <= archetype.aggroRange())
                        .min(Comparator.comparingDouble(player -> distance(player.x(), player.y(), x, y)))
                        .orElse(null);
            };

            boolean pursuingTarget = target != null && insideLeash(target.x(), target.y());
            if (!pursuingTarget) {
                if (nowMillis < nextIdleAiAt) return List.of();
                nextIdleAiAt = nowMillis + IDLE_AI_INTERVAL_MILLIS;
            } else {
                nextIdleAiAt = nowMillis;
            }

            if (pursuingTarget) {
                targetPlayerId = target.playerId();
                double distance = distance(target.x(), target.y(), x, y);
                if (distance <= archetype.attackRange()) {
                    lastMovementUpdateAt = nowMillis;
                    state = "attack";
                    if (nowMillis >= nextAttackAt) {
                        nextAttackAt = nowMillis + archetype.attackCooldownMillis();
                        attacksPerformed++;
                        boolean specialAttack = archetype.behavior() == MonsterBehavior.ELITE
                                && attacksPerformed % 3 == 0;
                        if (specialAttack) {
                            if (archetype.specialAttack() == MonsterSpecialAttack.SWEEP) {
                                heavyStrikeAngle = Math.atan2(target.y() - y, target.x() - x);
                                heavyStrikeWidth = HEAVY_STRIKE_SWEEP_WIDTH;
                                heavyStrikeHeight = HEAVY_STRIKE_SWEEP_HEIGHT;
                                heavyStrikeX = x + Math.cos(heavyStrikeAngle) * (heavyStrikeWidth / 2.0 + 8.0);
                                heavyStrikeY = y + Math.sin(heavyStrikeAngle) * (heavyStrikeWidth / 2.0 + 8.0);
                                heavyStrikeShape = "SWEEP";
                            } else {
                                heavyStrikeX = target.x();
                                heavyStrikeY = target.y();
                                heavyStrikeWidth = 0;
                                heavyStrikeHeight = 0;
                                heavyStrikeAngle = 0;
                                heavyStrikeShape = "CIRCLE";
                            }
                            heavyStrikeUntil = nowMillis + HEAVY_STRIKE_WINDUP_MILLIS;
                            state = "windup";
                            return List.of();
                        }
                        return List.of(new MonsterPlayerAttack(target.playerId(), id,
                                archetype.displayName(), archetype.attackDamage(), "monster-attack"));
                    }
                    return List.of();
                }
                state = "aggro";
                moveAlongPath(target.x(), target.y(), nowMillis,
                        movementStep(nowMillis, region.moveSpeed() * archetype.moveSpeedMultiplier()));
                return List.of();
            }

            targetPlayerId = null;
            state = archetype.behavior() == MonsterBehavior.PATROL ? "patrol" : "idle";
            double radiusX = Math.min(region.roamRadius(), region.width() / 2.0);
            double radiusY = Math.min(region.roamRadius(), region.height() / 2.0);
            double angle = (nowMillis - phase) / 2400.0 + (id.hashCode() & 0xff) / 255.0 * Math.PI * 2;
            double targetX = homeX + Math.cos(angle) * radiusX;
            double targetY = homeY + Math.sin(angle) * radiusY;
            moveAlongPath(targetX, targetY, nowMillis,
                    movementStep(nowMillis, region.moveSpeed() * archetype.moveSpeedMultiplier()));
            return List.of();
        }

        private boolean insideHeavyStrike(MonsterTarget player) {
            if ("SWEEP".equals(heavyStrikeShape)) {
                return MonsterAttackArea.containsSweep(heavyStrikeX, heavyStrikeY,
                        heavyStrikeWidth, heavyStrikeHeight, heavyStrikeAngle, player.x(), player.y());
            }
            return MonsterAttackArea.containsCircle(heavyStrikeX, heavyStrikeY,
                    HEAVY_STRIKE_RADIUS, player.x(), player.y());
        }

        private double movementStep(long nowMillis, double speedPerSecond) {
            long elapsedMillis;
            if (lastMovementUpdateAt < 0) {
                elapsedMillis = 100L;
            } else {
                elapsedMillis = Math.max(0L, Math.min(500L, nowMillis - lastMovementUpdateAt));
            }
            lastMovementUpdateAt = nowMillis;
            return speedPerSecond * elapsedMillis / 1_000.0;
        }

        private void moveAlongPath(double targetX, double targetY, long nowMillis, double maxStep) {
            int targetCellX = pathfinder.cellX(targetX);
            int targetCellY = pathfinder.cellY(targetY);
            boolean targetCellChanged = targetCellX != pathTargetCellX
                    || targetCellY != pathTargetCellY;
            boolean retryBlockedPath = pathCalculated && path.isEmpty() && nowMillis >= nextPathAt;
            if (!pathCalculated || targetCellChanged || retryBlockedPath) {
                path = pathfinder.findPath(x, y, targetX, targetY,
                        region.x(), region.y(),
                        region.x() + region.width(), region.y() + region.height());
                pathIndex = 0;
                pathTargetCellX = targetCellX;
                pathTargetCellY = targetCellY;
                pathCalculated = true;
                nextPathAt = nowMillis + 500L;
            }

            while (pathIndex < path.size()) {
                GridPathfinder.Waypoint waypoint = path.get(pathIndex);
                if (Math.hypot(waypoint.x() - x, waypoint.y() - y) <= 5.0) {
                    pathIndex++;
                    continue;
                }
                moveToward(waypoint.x(), waypoint.y(), maxStep);
                return;
            }
            if (path.isEmpty()) state = "blocked";
        }

        private boolean insideLeash(double targetX, double targetY) {
            double margin = Math.max(40.0, region.roamRadius());
            return targetX >= region.x() - margin && targetX <= region.x() + region.width() + margin
                    && targetY >= region.y() - margin && targetY <= region.y() + region.height() + margin;
        }

        private void moveToward(double targetX, double targetY, double maxStep) {
            double dx = targetX - x;
            double dy = targetY - y;
            double distance = Math.hypot(dx, dy);
            if (distance <= maxStep || distance == 0) {
                x = targetX;
                y = targetY;
            } else {
                x += dx / distance * maxStep;
                y += dy / distance * maxStep;
            }
            x = clamp(x, region.x(), region.x() + region.width());
            y = clamp(y, region.y(), region.y() + region.height());
        }

        private static double distance(double x1, double y1, double x2, double y2) {
            return Math.hypot(x2 - x1, y2 - y1);
        }

        private MonsterState snapshot() {
            return new MonsterState(id, region.monsterType(), mapId, region.id(),
                    x, y, homeX, homeY, hp, archetype.maxHp(), state,
                    heavyStrikeUntil > 0 ? heavyStrikeX : 0,
                    heavyStrikeUntil > 0 ? heavyStrikeY : 0,
                    heavyStrikeUntil > 0 && "CIRCLE".equals(heavyStrikeShape) ? HEAVY_STRIKE_RADIUS : 0,
                    heavyStrikeUntil > 0 ? heavyStrikeWidth : 0,
                    heavyStrikeUntil > 0 ? heavyStrikeHeight : 0,
                    heavyStrikeUntil > 0 ? heavyStrikeAngle : 0,
                    heavyStrikeUntil > 0 ? heavyStrikeShape : "");
        }
    }

    public record MonsterTarget(String playerId, String mapId, double x, double y) {
    }

    private record ExpiringLootDrop(String dropId, long createdAt, long expiresAt)
            implements Comparable<ExpiringLootDrop> {
        @Override
        public int compareTo(ExpiringLootDrop other) {
            int byExpiry = Long.compare(expiresAt, other.expiresAt);
            return byExpiry != 0 ? byExpiry : dropId.compareTo(other.dropId);
        }
    }
}
