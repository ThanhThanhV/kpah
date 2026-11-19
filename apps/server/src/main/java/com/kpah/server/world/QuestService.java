package com.kpah.server.world;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class QuestService {
    private static final double INTERACTION_RANGE = 100.0;

    private final QuestProgressRepository progress;
    private final NpcRegistry npcs;
    private final QuestCatalog catalog;
    private final Map<String, SnapshotCacheEntry> snapshotCache = new ConcurrentHashMap<>();

    @Autowired
    public QuestService(QuestProgressRepository progress, NpcRegistry npcs, QuestCatalog catalog) {
        this.progress = progress;
        this.npcs = npcs;
        this.catalog = catalog;
    }

    public QuestService(QuestProgressRepository progress, StarterWorldRegistry worlds, QuestCatalog catalog) {
        this(progress, new NpcRegistry(worlds), catalog);
    }

    @Transactional
    public QuestInteractionResult interact(String characterId, String mapId, String npcId,
                                           double playerX, double playerY) {
        NpcDefinition npc = npcs.require(mapId, npcId);
        if (Math.hypot(npc.centerX() - playerX, npc.centerY() - playerY) > INTERACTION_RANGE) {
            throw new IllegalArgumentException("Move closer to the NPC to talk.");
        }

        List<QuestCatalog.QuestDefinition> npcQuests = catalog.findByNpcId(npcId);
        if (npcQuests.isEmpty()) {
            return new QuestInteractionResult(npc.name(), npc.dialogue(), "", "dialogue", 0, 0, 0);
        }

        QuestCatalog.QuestDefinition lastClaimed = null;
        for (QuestCatalog.QuestDefinition definition : npcQuests) {
            QuestProgress quest = progress.findById(key(characterId, definition.questId())).orElse(null);
            if (quest == null) {
                quest = progress.save(new QuestProgress(characterId, definition.questId()));
                invalidateSnapshotAfterCommit(characterId);
                return result(definition, definition.startMessage(), quest, 0);
            }
            if (quest.isClaimed()) {
                lastClaimed = definition;
                continue;
            }
            if (quest.getProgress() >= definition.requiredKills()) {
                quest.claim();
                progress.save(quest);
                invalidateSnapshotAfterCommit(characterId);
                return result(definition, definition.completionMessage(), quest, definition.experienceReward());
            }
            return result(definition, "Defeat " + definition.targetDisplayName() + ": "
                    + quest.getProgress() + "/" + definition.requiredKills(), quest, 0);
        }
        return new QuestInteractionResult(lastClaimed.npcName(), lastClaimed.claimedMessage(),
                lastClaimed.questId(), "claimed", lastClaimed.requiredKills(),
                lastClaimed.requiredKills(), 0);
    }

    @Transactional
    public void onMonsterDefeated(String characterId, String mapId, String monsterType) {
        if (mapId == null || monsterType == null) return;
        for (QuestCatalog.QuestDefinition definition : catalog.all()) {
            if (!definition.targetMapId().equals(mapId)
                    || !definition.targetMonsterType().equals(monsterType)) continue;
            progress.findById(key(characterId, definition.questId())).ifPresent(quest -> {
                if (!quest.isClaimed() && quest.getProgress() < definition.requiredKills()) {
                    quest.increment(definition.requiredKills());
                    progress.save(quest);
                    invalidateSnapshotAfterCommit(characterId);
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> snapshotAll(String characterId) {
        Map<String, QuestProgress> progressByQuest = progressByQuest(characterId);
        return catalog.all().stream()
                .map(definition -> snapshotOne(definition, progressByQuest.get(definition.questId())))
                .toList();
    }

    /** Legacy default-quest view retained for clients that have not migrated to the journal list. */
    @Transactional(readOnly = true)
    public Map<String, Object> snapshot(String characterId) {
        QuestCatalog.QuestDefinition definition = catalog.defaultQuest();
        return snapshotOne(definition, progressByQuest(characterId).get(definition.questId()));
    }

    /** Reads all quest state for a character with one database query for the world snapshot. */
    @Transactional(readOnly = true)
    public Map<String, Object> snapshotState(String characterId) {
        SnapshotCacheEntry entry = snapshotCache.computeIfAbsent(
                characterId, ignored -> new SnapshotCacheEntry());
        return entry.getOrLoad(() -> loadSnapshotState(characterId));
    }

    public void evictSnapshot(String characterId) {
        if (characterId != null) snapshotCache.remove(characterId);
    }

    private Map<String, Object> loadSnapshotState(String characterId) {
        Map<String, QuestProgress> progressByQuest = progressByQuest(characterId);
        List<Map<String, Object>> allQuests = catalog.all().stream()
                .map(definition -> snapshotOne(definition, progressByQuest.get(definition.questId())))
                .toList();
        QuestCatalog.QuestDefinition defaultQuest = catalog.defaultQuest();
        return Map.of("quest", snapshotOne(defaultQuest, progressByQuest.get(defaultQuest.questId())),
                "quests", allQuests);
    }

    private void invalidateSnapshotAfterCommit(String characterId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    SnapshotCacheEntry entry = snapshotCache.get(characterId);
                    if (entry != null) entry.invalidate();
                }
            });
        } else {
            snapshotCache.remove(characterId);
        }
    }

    private Map<String, QuestProgress> progressByQuest(String characterId) {
        Map<String, QuestProgress> result = new HashMap<>();
        for (QuestProgress quest : progress.findAllByCharacterId(characterId)) {
            result.put(quest.getQuestId(), quest);
        }
        return result;
    }

    private Map<String, Object> snapshotOne(QuestCatalog.QuestDefinition definition, QuestProgress quest) {
        int current = quest == null ? 0 : quest.getProgress();
        String status = quest == null ? "available" : quest.isClaimed() ? "claimed"
                : current >= definition.requiredKills() ? "ready" : "active";
        return Map.of("questId", definition.questId(), "status", status,
                "progress", current, "required", definition.requiredKills(),
                "npcId", definition.npcId(), "npcName", definition.npcName(),
                "targetMapId", definition.targetMapId(),
                "targetMonsterType", definition.targetMonsterType(),
                "targetDisplayName", definition.targetDisplayName(),
                "experienceReward", definition.experienceReward());
    }

    private QuestInteractionResult result(QuestCatalog.QuestDefinition definition, String message,
                                          QuestProgress quest, int reward) {
        String status = quest.isClaimed() ? "claimed"
                : quest.getProgress() >= definition.requiredKills() ? "ready" : "active";
        return new QuestInteractionResult(definition.npcName(), message, definition.questId(), status,
                quest.getProgress(), definition.requiredKills(), reward);
    }

    private static final class SnapshotCacheEntry {
        private Map<String, Object> snapshot;

        private synchronized Map<String, Object> getOrLoad(Supplier<Map<String, Object>> loader) {
            if (snapshot == null) snapshot = loader.get();
            return snapshot;
        }

        private synchronized void invalidate() {
            snapshot = null;
        }
    }

    private String key(String characterId, String questId) { return characterId + ":" + questId; }

    public record QuestInteractionResult(String npcName, String message, String questId,
                                         String status, int progress, int required, int experienceReward) {
        public Map<String, Object> toPayload() {
            return Map.of("type", "quest", "npcName", npcName, "message", message,
                    "questId", questId, "status", status, "progress", progress,
                    "required", required, "experienceReward", experienceReward);
        }
    }
}
