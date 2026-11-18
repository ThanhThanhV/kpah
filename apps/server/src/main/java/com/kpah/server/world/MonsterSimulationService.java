package com.kpah.server.world;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;

@Service
public class MonsterSimulationService {
    private static final int BASIC_ATTACK_DAMAGE = 20;
    private static final double BASIC_ATTACK_RANGE = 58.0;

    private final Map<String, List<MonsterSpawnRegion>> regionsByMap = new ConcurrentHashMap<>();
    private final Map<String, GridPathfinder> pathfindersByMap = new ConcurrentHashMap<>();
    private final Map<String, MonsterRuntime> monsters = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Long>> nextSpawnAt = new ConcurrentHashMap<>();
    private final Map<String, LootDropState> lootDrops = new ConcurrentHashMap<>();
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
            for (MonsterSpawnRegion region : map.monsterSpawns()) {
                archetypes.require(region.monsterType());
                for (int i = 0; i < region.maxAlive(); i++) spawn(map.mapId(), region, i);
                schedules.put(region.id(), 0L);
            }
        }
    }

    public List<MonsterPlayerAttack> advance(long nowMillis, Collection<MonsterTarget> players) {
        List<MonsterPlayerAttack> attacks = new ArrayList<>();
        for (Map.Entry<String, List<MonsterSpawnRegion>> entry : regionsByMap.entrySet()) {
            String mapId = entry.getKey();
            for (MonsterSpawnRegion region : entry.getValue()) {
                long next = nextSpawnAt.get(mapId).getOrDefault(region.id(), 0L);
                long alive = monsters.values().stream()
                        .filter(monster -> monster.mapId.equals(mapId)
                                && monster.region.id().equals(region.id()) && monster.hp > 0).count();
                if (alive < region.maxAlive() && nowMillis >= next) {
                    spawn(mapId, region, (int) alive);
                    nextSpawnAt.get(mapId).put(region.id(), nowMillis + region.respawnMillis());
                }
            }
        }

        lootDrops.values().removeIf(drop -> nowMillis - drop.createdAt() > 300_000L);
        for (MonsterRuntime monster : monsters.values()) {
            if (monster.hp <= 0) {
                if (nowMillis >= monster.respawnAt) monsters.remove(monster.id);
                continue;
            }
            MonsterPlayerAttack attack = monster.advance(nowMillis, players);
            if (attack != null) attacks.add(attack);
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
                long respawnAt = nowMillis + monster.region.respawnMillis();
                monster.respawnAt = respawnAt;
                nextSpawnAt.get(mapId).put(monster.region.id(), respawnAt);
                for (MonsterDropTable.RolledDrop rolled : dropTable.roll(
                        mapId, monster.region.monsterType(), ThreadLocalRandom.current())) {
                    LootDropState drop = new LootDropState(UUID.randomUUID().toString(),
                            rolled.itemCode(), rolled.amount(), mapId, monster.x, monster.y, nowMillis);
                    lootDrops.put(drop.dropId(), drop);
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

    public void restoreLoot(LootDropState drop) {
        if (drop != null && drop.amount() > 0) lootDrops.putIfAbsent(drop.dropId(), drop);
    }

    public List<LootDropState> collectNearbyLoot(String mapId, double x, double y) {
        return lootDrops.values().stream()
                .filter(drop -> drop.mapId().equals(mapId))
                .filter(drop -> Math.hypot(drop.x() - x, drop.y() - y) <= 38.0)
                .filter(drop -> lootDrops.remove(drop.dropId(), drop))
                .toList();
    }

    private void spawn(String mapId, MonsterSpawnRegion region, int ordinal) {
        String id = UUID.randomUUID().toString();
        double offsetX = region.maxAlive() <= 1 ? 0
                : ((ordinal % region.maxAlive()) - (region.maxAlive() - 1) / 2.0) * 18.0;
        double offsetY = (ordinal % 2 == 0 ? -1 : 1) * 12.0;
        double homeX = clamp(region.centerX() + offsetX, region.x(), region.x() + region.width());
        double homeY = clamp(region.centerY() + offsetY, region.y(), region.y() + region.height());
        monsters.put(id, new MonsterRuntime(id, mapId, region, archetypes.require(region.monsterType()),
                homeX, homeY, pathfindersByMap.get(mapId)));
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
        private int pathTargetCellX = Integer.MIN_VALUE;
        private int pathTargetCellY = Integer.MIN_VALUE;
        private final long phase = System.nanoTime() / 1_000_000L;
        private volatile double x;
        private volatile double y;
        private volatile int hp;
        private volatile long respawnAt = Long.MAX_VALUE;
        private volatile long nextAttackAt;
        private volatile String targetPlayerId;
        private volatile String provokedPlayerId;
        private volatile long provokedUntil;
        private volatile String state = "idle";

        private MonsterRuntime(String id, String mapId, MonsterSpawnRegion region, MonsterArchetype archetype,
                               double homeX, double homeY, GridPathfinder pathfinder) {
            this.id = id; this.mapId = mapId; this.region = region; this.archetype = archetype;
            this.pathfinder = pathfinder; this.hp = archetype.maxHp();
            this.homeX = homeX; this.homeY = homeY; this.x = homeX; this.y = homeY;
        }

        private MonsterPlayerAttack advance(long nowMillis, Collection<MonsterTarget> players) {
            MonsterTarget target = switch (archetype.behavior()) {
                case PATROL -> null;
                case DEFENSIVE -> {
                    if (nowMillis > provokedUntil) {
                        provokedPlayerId = null;
                        yield null;
                    }
                    yield players.stream()
                            .filter(player -> mapId.equals(player.mapId()))
                            .filter(player -> player.playerId().equals(provokedPlayerId))
                            .filter(player -> distance(player.x(), player.y(), x, y) <= archetype.aggroRange())
                            .findFirst().orElse(null);
                }
                case AGGRESSIVE, ELITE -> players.stream()
                        .filter(player -> mapId.equals(player.mapId()))
                        .filter(player -> distance(player.x(), player.y(), x, y) <= archetype.aggroRange())
                        .min(Comparator.comparingDouble(player -> distance(player.x(), player.y(), x, y)))
                        .orElse(null);
            };

            if (target != null && insideLeash(target.x(), target.y())) {
                targetPlayerId = target.playerId();
                double distance = distance(target.x(), target.y(), x, y);
                if (distance <= archetype.attackRange()) {
                    state = "attack";
                    if (nowMillis >= nextAttackAt) {
                        nextAttackAt = nowMillis + archetype.attackCooldownMillis();
                        return new MonsterPlayerAttack(target.playerId(), id, archetype.attackDamage());
                    }
                    return null;
                }
                state = "aggro";
                moveAlongPath(target.x(), target.y(), nowMillis,
                        region.moveSpeed() * archetype.moveSpeedMultiplier() * 0.1);
                return null;
            }

            targetPlayerId = null;
            state = archetype.behavior() == MonsterBehavior.PATROL ? "patrol" : "idle";
            double radiusX = Math.min(region.roamRadius(), region.width() / 2.0);
            double radiusY = Math.min(region.roamRadius(), region.height() / 2.0);
            double angle = (nowMillis - phase) / 2400.0 + (id.hashCode() & 0xff) / 255.0 * Math.PI * 2;
            double targetX = homeX + Math.cos(angle) * radiusX;
            double targetY = homeY + Math.sin(angle) * radiusY;
            moveAlongPath(targetX, targetY, nowMillis,
                    region.moveSpeed() * archetype.moveSpeedMultiplier() * 0.1);
            return null;
        }

        private void moveAlongPath(double targetX, double targetY, long nowMillis, double maxStep) {
            int targetCellX = pathfinder.cellX(targetX);
            int targetCellY = pathfinder.cellY(targetY);
            if (nowMillis >= nextPathAt || path.isEmpty()
                    || targetCellX != pathTargetCellX || targetCellY != pathTargetCellY) {
                path = pathfinder.findPath(x, y, targetX, targetY,
                        region.x(), region.y(),
                        region.x() + region.width(), region.y() + region.height());
                pathIndex = 0;
                pathTargetCellX = targetCellX;
                pathTargetCellY = targetCellY;
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
                    x, y, homeX, homeY, hp, archetype.maxHp(), state);
        }
    }

    public record MonsterTarget(String playerId, String mapId, double x, double y) {
    }
}
