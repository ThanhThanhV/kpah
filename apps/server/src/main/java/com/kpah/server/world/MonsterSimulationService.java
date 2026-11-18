package com.kpah.server.world;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class MonsterSimulationService {
    private static final int SLIME_MAX_HP = 60;
    private static final int BASIC_ATTACK_DAMAGE = 20;
    private static final double BASIC_ATTACK_RANGE = 58.0;
    private static final double AGGRO_RANGE = 150.0;
    private static final double MONSTER_ATTACK_RANGE = 30.0;
    private static final int MONSTER_ATTACK_DAMAGE = 8;
    private static final long MONSTER_ATTACK_COOLDOWN_MILLIS = 1_100L;

    private final Map<String, List<MonsterSpawnRegion>> regionsByMap = new ConcurrentHashMap<>();
    private final Map<String, MonsterRuntime> monsters = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Long>> nextSpawnAt = new ConcurrentHashMap<>();

    public MonsterSimulationService(StarterWorldRegistry worlds) {
        for (WorldMapGeometry map : worlds.all()) {
            regionsByMap.put(map.mapId(), map.monsterSpawns());
            Map<String, Long> schedules = new ConcurrentHashMap<>();
            nextSpawnAt.put(map.mapId(), schedules);
            for (MonsterSpawnRegion region : map.monsterSpawns()) {
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

    public MonsterAttackResult applyBasicAttack(String mapId, double attackerX, double attackerY,
                                                String monsterId, long nowMillis) {
        MonsterRuntime monster = monsters.get(monsterId);
        if (monster == null || !monster.mapId.equals(mapId) || monster.hp <= 0) {
            return MonsterAttackResult.rejected("Target is no longer available.");
        }
        double distance = Math.hypot(monster.x - attackerX, monster.y - attackerY);
        if (distance > BASIC_ATTACK_RANGE) {
            return MonsterAttackResult.rejected("Target is out of attack range.");
        }
        synchronized (monster) {
            if (monster.hp <= 0) return MonsterAttackResult.rejected("Target is already defeated.");
            monster.hp = Math.max(0, monster.hp - BASIC_ATTACK_DAMAGE);
            if (monster.hp == 0) {
                long respawnAt = nowMillis + monster.region.respawnMillis();
                monster.respawnAt = respawnAt;
                nextSpawnAt.get(mapId).put(monster.region.id(), respawnAt);
            }
            return new MonsterAttackResult(true, "Hit", monster.snapshot(), BASIC_ATTACK_DAMAGE);
        }
    }

    public List<MonsterState> snapshot(String mapId) {
        return monsters.values().stream()
                .filter(monster -> monster.mapId.equals(mapId) && monster.hp > 0)
                .map(MonsterRuntime::snapshot).toList();
    }

    private void spawn(String mapId, MonsterSpawnRegion region, int ordinal) {
        String id = UUID.randomUUID().toString();
        double offsetX = region.maxAlive() <= 1 ? 0
                : ((ordinal % region.maxAlive()) - (region.maxAlive() - 1) / 2.0) * 18.0;
        double offsetY = (ordinal % 2 == 0 ? -1 : 1) * 12.0;
        double homeX = clamp(region.centerX() + offsetX, region.x(), region.x() + region.width());
        double homeY = clamp(region.centerY() + offsetY, region.y(), region.y() + region.height());
        monsters.put(id, new MonsterRuntime(id, mapId, region, homeX, homeY));
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static final class MonsterRuntime {
        private final String id;
        private final String mapId;
        private final MonsterSpawnRegion region;
        private final double homeX;
        private final double homeY;
        private final long phase = System.nanoTime() / 1_000_000L;
        private volatile double x;
        private volatile double y;
        private volatile int hp = SLIME_MAX_HP;
        private volatile long respawnAt = Long.MAX_VALUE;
        private volatile long nextAttackAt;
        private volatile String targetPlayerId;
        private volatile String state = "idle";

        private MonsterRuntime(String id, String mapId, MonsterSpawnRegion region, double homeX, double homeY) {
            this.id = id; this.mapId = mapId; this.region = region;
            this.homeX = homeX; this.homeY = homeY; this.x = homeX; this.y = homeY;
        }

        private MonsterPlayerAttack advance(long nowMillis, Collection<MonsterTarget> players) {
            MonsterTarget target = players.stream()
                    .filter(player -> mapId.equals(player.mapId()))
                    .filter(player -> distance(player.x(), player.y(), x, y) <= AGGRO_RANGE)
                    .min(Comparator.comparingDouble(player -> distance(player.x(), player.y(), x, y)))
                    .orElse(null);

            if (target != null && insideLeash(target.x(), target.y())) {
                targetPlayerId = target.playerId();
                double distance = distance(target.x(), target.y(), x, y);
                if (distance <= MONSTER_ATTACK_RANGE) {
                    state = "attack";
                    if (nowMillis >= nextAttackAt) {
                        nextAttackAt = nowMillis + MONSTER_ATTACK_COOLDOWN_MILLIS;
                        return new MonsterPlayerAttack(target.playerId(), id, MONSTER_ATTACK_DAMAGE);
                    }
                    return null;
                }
                state = "aggro";
                moveToward(target.x(), target.y(), region.moveSpeed() * 0.1);
                return null;
            }

            targetPlayerId = null;
            state = "idle";
            double radiusX = Math.min(region.roamRadius(), region.width() / 2.0);
            double radiusY = Math.min(region.roamRadius(), region.height() / 2.0);
            double angle = (nowMillis - phase) / 2400.0 + (id.hashCode() & 0xff) / 255.0 * Math.PI * 2;
            double targetX = homeX + Math.cos(angle) * radiusX;
            double targetY = homeY + Math.sin(angle) * radiusY;
            moveToward(targetX, targetY, region.moveSpeed() * 0.1);
            return null;
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
                    x, y, homeX, homeY, hp, SLIME_MAX_HP, state);
        }
    }

    public record MonsterTarget(String playerId, String mapId, double x, double y) {
    }
}
