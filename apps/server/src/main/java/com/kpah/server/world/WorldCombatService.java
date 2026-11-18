package com.kpah.server.world;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class WorldCombatService {
    private static final long ATTACK_COOLDOWN_MILLIS = 600;
    private final Map<String, Long> lastAttackAt = new ConcurrentHashMap<>();
    private final MonsterSimulationService monsters;

    public WorldCombatService(MonsterSimulationService monsters) {
        this.monsters = monsters;
    }

    public MonsterAttackResult basicAttack(String playerId, PlayerMotionState attacker,
                                           String targetMonsterId, int attackBonus, long nowMillis) {
        if (playerId == null || playerId.isBlank() || attacker == null
                || targetMonsterId == null || targetMonsterId.isBlank()) {
            return MonsterAttackResult.rejected("Invalid attack request.");
        }
        long previous = lastAttackAt.getOrDefault(playerId, 0L);
        if (nowMillis - previous < ATTACK_COOLDOWN_MILLIS) {
            return MonsterAttackResult.rejected("Attack is on cooldown.");
        }
        MonsterAttackResult result = monsters.applyBasicAttack(
                attacker.mapId(), attacker.x(), attacker.y(), targetMonsterId, attackBonus, nowMillis);
        if (result.accepted()) {
            lastAttackAt.put(playerId, nowMillis);
            monsters.provoke(targetMonsterId, playerId, nowMillis);
        }
        return result;
    }

    public void removePlayer(String playerId) {
        if (playerId != null) lastAttackAt.remove(playerId);
    }
}
