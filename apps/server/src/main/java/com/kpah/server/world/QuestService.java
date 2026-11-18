package com.kpah.server.world;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestService {
    private static final String QUEST_ID = "meadow-slime-hunt";
    private static final int REQUIRED_KILLS = 3;
    private static final int REWARD_EXPERIENCE = 100;
    private static final double INTERACTION_RANGE = 100.0;

    private final QuestProgressRepository progress;
    private final StarterWorldRegistry worlds;

    public QuestService(QuestProgressRepository progress, StarterWorldRegistry worlds) {
        this.progress = progress;
        this.worlds = worlds;
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

        QuestProgress quest = progress.findById(key(characterId)).orElse(null);
        if (quest == null) {
            quest = progress.save(new QuestProgress(characterId, QUEST_ID));
            return result("Meadow Guide", "Help the meadow: defeat 3 Green Slimes, then return to claim your reward.", quest, 0);
        }
        if (quest.isClaimed()) {
            return result("Meadow Guide", "Thank you for helping the meadow!", quest, 0);
        }
        if (quest.getProgress() >= REQUIRED_KILLS) {
            quest.claim();
            progress.save(quest);
            return result("Meadow Guide", "Quest complete! You received 100 EXP.", quest, REWARD_EXPERIENCE);
        }
        return result("Meadow Guide", "Defeat Green Slimes: " + quest.getProgress()
                + "/" + REQUIRED_KILLS, quest, 0);
    }

    @Transactional
    public void onGreenSlimeDefeated(String characterId) {
        progress.findById(key(characterId)).ifPresent(quest -> {
            if (!quest.isClaimed()) {
                quest.increment();
                progress.save(quest);
            }
        });
    }

    @Transactional(readOnly = true)
    public Map<String, Object> snapshot(String characterId) {
        QuestProgress quest = progress.findById(key(characterId)).orElse(null);
        if (quest == null) return Map.of("questId", QUEST_ID, "status", "available",
                "progress", 0, "required", REQUIRED_KILLS);
        String status = quest.isClaimed() ? "claimed"
                : quest.getProgress() >= REQUIRED_KILLS ? "ready" : "active";
        return Map.of("questId", QUEST_ID, "status", status,
                "progress", quest.getProgress(), "required", REQUIRED_KILLS);
    }

    private QuestInteractionResult result(String npcName, String message, QuestProgress quest, int reward) {
        String status = quest.isClaimed() ? "claimed"
                : quest.getProgress() >= REQUIRED_KILLS ? "ready" : "active";
        return new QuestInteractionResult(npcName, message, QUEST_ID, status,
                quest.getProgress(), REQUIRED_KILLS, reward);
    }

    private String key(String characterId) { return characterId + ":" + QUEST_ID; }

    public record QuestInteractionResult(String npcName, String message, String questId,
                                         String status, int progress, int required, int experienceReward) {
        public Map<String, Object> toPayload() {
            return Map.of("type", "quest", "npcName", npcName, "message", message,
                    "questId", questId, "status", status, "progress", progress,
                    "required", required, "experienceReward", experienceReward);
        }
    }
}
