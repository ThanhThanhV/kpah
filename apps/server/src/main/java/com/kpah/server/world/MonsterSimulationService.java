package com.kpah.server.world;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Lightweight deterministic zone simulation for the first monster prototype.
 * Combat will mutate HP through a separate server-authoritative combat service.
 */
@Service
public class MonsterSimulationService {
    private static final int SLIME_MAX_HP = 60;
    private final StarterWorldRegistry worlds;
    private final Map<String, List<MonsterSpawnRegion>> regionsByMap = new ConcurrentHashMap<>();
    private final Map<String, MonsterRuntime> monsters = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Long>> nextSpawnAt = new ConcurrentHashMap<>();

    public MonsterSimulationService(StarterWorldRegistry worlds) {
        this.worlds = worlds;
        for (WorldMapGeometry map : worlds.all()) {
            regionsByMap.put(map.mapId(), map.monsterSpawns());
            Map<String, Long> schedules = new ConcurrentHashMap<>();
            nextSpawnAt.put(map.mapId(), schedules);
            for (MonsterSpawnRegion region : map.monsterSpawns()) {
                for (int i = 0; i < region.maxAlive(); i++) {
                    spawn(map.mapId(), region, i);
                }
                schedules.put(region.id(), 0L);
            }
        }
    }

    public void advance(long nowMillis) {
        for (Map.Entry<String, List<MonsterSpawnRegion>> entry : regionsByMap.entrySet()) {
            String mapId = entry.getKey();
            for (MonsterSpawnRegion region : entry.getValue()) {
                long next = nextSpawnAt.get(mapId).getOrDefault(region.id(), 0L);
                long alive = monsters.values().stream()
                        .filter(monster -> monster.mapId.equals(mapId)
                                && monster.region.id().equals(region.id())
                                && monster.hp > 0)
                        .count();
                if (alive < region.maxAlive() && nowMillis >= next) {
                    spawn(mapId, region, (int) alive);
                    nextSpawnAt.get(mapId).put(region.id(), nowMillis + region.respawnMillis());
                }
            }
        }
        for (MonsterRuntime monster : monsters.values()) {
            monster.advance(nowMillis);
            if (monster.hp <= 0 && nowMillis >= monster.respawnAt) {
                monsters.remove(monster.id);
                nextSpawnAt.get(monster.mapId).merge(
                        monster.region.id(), nowMillis, Math::min);
            }
        }
    }

    public List<MonsterState> snapshot(String mapId) {
        return monsters.values().stream()
                .filter(monster -> monster.mapId.equals(mapId) && monster.hp > 0)
                .map(MonsterRuntime::snapshot)
                .toList();
    }

    private void spawn(String mapId, MonsterSpawnRegion region, int ordinal) {
        String id = UUID.randomUUID().toString();
        double offsetX = region.maxAlive() <= 1 ? 0
                : ((ordinal % region.maxAlive()) - (region.maxAlive() - 1) / 2.0) * 18.0;
        double offsetY = ((ordinal % 2) == 0 ? -1 : 1) * 12.0;
        double homeX = clamp(region.centerX() + offsetX, region.x(), region.x() + region.width());
        double homeY = clamp(region.centerY() + offsetY, region.y(), region.y() + region.height());
        monsters.put(id, new MonsterRuntime(id, mapId, region, homeX, homeY));
    }

    private double clamp(double value, double min, double max) {
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

        private MonsterRuntime(String id, String mapId, MonsterSpawnRegion region, double homeX, double homeY) {
            this.id = id;
            this.mapId = mapId;
            this.region = region;
            this.homeX = homeX;
            this.homeY = homeY;
            this.x = homeX;
            this.y = homeY;
        }

        private void advance(long nowMillis) {
            if (hp <= 0) return;
            double radiusX = Math.min(region.roamRadius(), region.width() / 2.0);
            double radiusY = Math.min(region.roamRadius(), region.height() / 2.0);
            double angle = (nowMillis - phase) / 2400.0 + (id.hashCode() & 0xff) / 255.0 * Math.PI * 2;
            double targetX = homeX + Math.cos(angle) * radiusX;
            double targetY = homeY + Math.sin(angle) * radiusY;
            double maxStep = region.moveSpeed() * 0.1;
            x += clamp(targetX - x, -maxStep, maxStep);
            y += clamp(targetY - y, -maxStep, maxStep);
            x = clamp(x, region.x(), region.x() + region.width());
            y = clamp(y, region.y(), region.y() + region.height());
        }

        private MonsterState snapshot() {
            return new MonsterState(id, region.monsterType(), mapId, region.id(),
                    x, y, homeX, homeY, hp, SLIME_MAX_HP, "idle");
        }

        private static double clamp(double value, double min, double max) {
            return Math.max(min, Math.min(max, value));
        }
    }
}
