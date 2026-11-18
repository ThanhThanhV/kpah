package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestService {
    private static final double INTERACTION_RANGE = 100.0;

    private final QuestProgressRepository progress;
    private final StarterWorldRegistry worlds;
    private final QuestCatalog catalog;

    public QuestService(QuestProgressRepository progress, StarterWorldRegistry worlds, QuestCatalog catalog) {
        this.progress = progress;
        this.worlds = worlds;
        this.catalog = catalog;
    }

    @Transactional
    public QuestInteractionResult interact(String characterId, String mapId, String npcId,
                                           double playerX, double playerY) {
        NpcDefinition npc = worlds.require(mapId).npcs().stream()
                .filter(candidate -> candidate.id().equals(npcId))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("NPC not found on this map."));
        if (Math.hypot(npc.centerX() - playerX, npc.centerY() - playerY) > INTERACTION_RANGE) {
            throw new IllegalArgumentException("Move closer to the NPC to talk.");
        }

        QuestCatalog.QuestDefinition definition = catalog.findByNpcId(npcId);
        if (definition == null) {
            return new QuestInteractionResult(npc.name(), npc.dialogue(), "", "dialogue", 0, 0, 0);
        }

        QuestProgress quest = progress.findById(key(characterId, definition.questId())).orElse(null);
        if (quest == null) {
            quest = progress.save(new QuestProgress(characterId, definition.questId()));
            return result(definition, definition.startMessage(), quest, 0);
        }
        if (quest.isClaimed()) {
            return result(definition, definition.claimedMessage(), quest, 0);
        }
        if (quest.getProgress() >= definition.requiredKills()) {
            quest.claim();
            progress.save(quest);
            return result(definition, definition.completionMessage(), quest, definition.experienceReward());
        }
        return result(definition, "Defeat " + definition.targetDisplayName() + ": "
                + quest.getProgress() + "/" + definition.requiredKills(), quest, 0);
    }

    @Transactional
    public void onMonsterDefeated(String characterId, String monsterType) {
        if (monsterType == null) return;
        for (QuestCatalog.QuestDefinition definition : catalog.all()) {
            if (!definition.targetMonsterType().equals(monsterType)) continue;
            progress.findById(key(characterId, definition.questId())).ifPresent(quest -> {
                if (!quest.isClaimed() && quest.getProgress() < definition.requiredKills()) {
                    quest.increment();
                    progress.save(quest);
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> snapshot(String characterId) {
        QuestCatalog.QuestDefinition definition = catalog.defaultQuest();
        QuestProgress quest = progress.findById(key(characterId, definition.questId())).orElse(null);
        if (quest == null) return Map.of("questId", definition.questId(), "status", "available",
                "progress", 0, "required", definition.requiredKills(),
                "npcName", definition.npcName(), "targetDisplayName", definition.targetDisplayName(),
                "experienceReward", definition.experienceReward());
        String status = quest.isClaimed() ? "claimed"
                : quest.getProgress() >= definition.requiredKills() ? "ready" : "active";
        return Map.of("questId", definition.questId(), "status", status,
                "progress", quest.getProgress(), "required", definition.requiredKills(),
                "npcName", definition.npcName(), "targetDisplayName", definition.targetDisplayName(),
                "experienceReward", definition.experienceReward());
    }

    private QuestInteractionResult result(QuestCatalog.QuestDefinition definition, String message,
                                          QuestProgress quest, int reward) {
        String status = quest.isClaimed() ? "claimed"
                : quest.getProgress() >= definition.requiredKills() ? "ready" : "active";
        return new QuestInteractionResult(definition.npcName(), message, definition.questId(), status,
                quest.getProgress(), definition.requiredKills(), reward);
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
