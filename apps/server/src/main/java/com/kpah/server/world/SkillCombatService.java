package com.kpah.server.world;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class SkillCombatService {
    private final SkillCatalog catalog;
    private final MonsterSimulationService monsters;
    private final Map<String, Long> nextCastAt = new ConcurrentHashMap<>();

    public SkillCombatService(SkillCatalog catalog, MonsterSimulationService monsters) {
        this.catalog = catalog;
        this.monsters = monsters;
    }

    public synchronized SkillCastResult cast(String playerId, PlayerMotionState caster, String skillId,
                                String targetMonsterId, long nowMillis) {
        if (playerId == null || playerId.isBlank() || caster == null
                || targetMonsterId == null || targetMonsterId.isBlank()) {
            return SkillCastResult.rejected("Invalid skill request.");
        }
        SkillDefinition skill = catalog.find(skillId);
        if (skill == null) return SkillCastResult.rejected("Unknown skill.");
        String cooldownKey = playerId + ":" + skillId;
        long readyAt = nextCastAt.getOrDefault(cooldownKey, 0L);
        if (nowMillis < readyAt) return SkillCastResult.rejected("Skill is on cooldown.");

        MonsterAttackResult attack = monsters.applySkillAttack(
                caster.mapId(), caster.x(), caster.y(), targetMonsterId,
                skill.damage(), skill.range(), nowMillis);
        if (!attack.accepted()) return SkillCastResult.rejected(attack.message());

        nextCastAt.put(cooldownKey, nowMillis + skill.cooldownMillis());
        return new SkillCastResult(true, "Skill cast", skill, attack);
    }

    public void removePlayer(String playerId) {
        if (playerId == null) return;
        nextCastAt.keySet().removeIf(key -> key.startsWith(playerId + ":"));
    }
}
