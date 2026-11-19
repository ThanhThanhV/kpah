package com.kpah.server.world;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class SkillCombatService {
    private static final long REGEN_INTERVAL_MILLIS = 1_000L;
    private static final int PLAYER_LOCK_STRIPES = 64;
    private final Object[] playerLocks = createPlayerLocks();
    private final SkillCatalog catalog;
    private final MonsterSimulationService monsters;
    private final Map<String, Long> nextCastAt = new ConcurrentHashMap<>();
    private final Map<String, ResourceState> resources = new ConcurrentHashMap<>();

    public SkillCombatService(SkillCatalog catalog, MonsterSimulationService monsters) {
        this.catalog = catalog;
        this.monsters = monsters;
    }

    public SkillCastResult cast(String playerId, String classCode, PlayerMotionState caster,
                                String skillId, String targetMonsterId, int attackBonus,
                                int level, long nowMillis) {
        if (playerId == null || playerId.isBlank() || classCode == null || caster == null
                || targetMonsterId == null || targetMonsterId.isBlank()) {
            return SkillCastResult.rejected("Invalid skill request.", 0);
        }
        synchronized (lockFor(playerId)) {
            int mana = manaFor(playerId, classCode, level, nowMillis);
            SkillDefinition skill = catalog.find(skillId);
            if (skill == null) return SkillCastResult.rejected("Unknown skill.", mana);
            if (!skill.classCode().equalsIgnoreCase(classCode)) {
                return SkillCastResult.rejected("This skill is not available to your class.", mana);
            }
            if (level < skill.requiredLevel()) {
                return SkillCastResult.rejected("Requires level " + skill.requiredLevel() + " to unlock this skill.", mana);
            }
            if (mana < skill.manaCost()) return SkillCastResult.rejected("Not enough mana.", mana);
            String cooldownKey = playerId + ":" + skillId;
            long readyAt = nextCastAt.getOrDefault(cooldownKey, 0L);
            if (nowMillis < readyAt) return SkillCastResult.rejected("Skill is on cooldown.", mana);

            MonsterAttackResult attack = monsters.applySkillAttack(
                    caster.mapId(), caster.x(), caster.y(), targetMonsterId,
                    skill.damage() + Math.max(0, attackBonus), skill.range(), nowMillis);
            if (!attack.accepted()) return SkillCastResult.rejected(attack.message(), mana);

            monsters.provoke(targetMonsterId, playerId, nowMillis);
            int remaining = mana - skill.manaCost();
            resources.put(playerId, new ResourceState(remaining, nowMillis));
            nextCastAt.put(cooldownKey, nowMillis + skill.cooldownMillis());
            return new SkillCastResult(true, "Skill cast", skill, attack, remaining);
        }
    }

    public void restore(String playerId, String classCode, int level, int persistedMana, long nowMillis) {
        if (playerId == null || playerId.isBlank()) return;
        synchronized (lockFor(playerId)) {
            int maximum = catalog.maxMana(classCode, level);
            resources.put(playerId, new ResourceState(Math.max(0, Math.min(maximum, persistedMana)), nowMillis));
            nextCastAt.keySet().removeIf(key -> key.startsWith(playerId + ":"));
        }
    }

    public int manaFor(String playerId, String classCode, int level, long nowMillis) {
        if (playerId == null || playerId.isBlank()) return 0;
        synchronized (lockFor(playerId)) {
            int maxMana = catalog.maxMana(classCode, level);
            ResourceState state = resources.computeIfAbsent(playerId, ignored -> new ResourceState(maxMana, nowMillis));
            long elapsed = Math.max(0L, nowMillis - state.lastUpdatedAt());
            int regenerated = (int) (elapsed * catalog.manaRegenerationPerSecond() / REGEN_INTERVAL_MILLIS);
            int mana = Math.min(maxMana, state.mana() + regenerated);
            if (regenerated > 0) {
                resources.put(playerId, new ResourceState(mana, nowMillis));
            }
            return mana;
        }
    }

    public int maxMana(String classCode) { return catalog.maxMana(classCode); }
    public int maxMana(String classCode, int level) { return catalog.maxMana(classCode, level); }
    public Map<String, SkillDefinition> skillsFor(String classCode) { return catalog.forClass(classCode); }
    public Map<String, SkillDefinition> skillsFor(String classCode, int level) {
        return catalog.forClass(classCode, level);
    }

    public void removePlayer(String playerId) {
        if (playerId == null) return;
        synchronized (lockFor(playerId)) {
            nextCastAt.keySet().removeIf(key -> key.startsWith(playerId + ":"));
            resources.remove(playerId);
        }
    }

    private Object lockFor(String playerId) {
        return playerLocks[(playerId.hashCode() & Integer.MAX_VALUE) % playerLocks.length];
    }

    private static Object[] createPlayerLocks() {
        Object[] locks = new Object[PLAYER_LOCK_STRIPES];
        for (int i = 0; i < locks.length; i++) locks[i] = new Object();
        return locks;
    }

    private record ResourceState(int mana, long lastUpdatedAt) { }
}
