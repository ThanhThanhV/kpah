package com.kpah.server.world;

import java.util.Collection;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class QuestCatalog {
    private final Map<String, QuestDefinition> questsById = Map.of(
            "meadow-slime-hunt", new QuestDefinition(
                    "meadow-slime-hunt", "6", "Meadow Guide",
                    "green-slime", "Green Slimes", 3, 100,
                    "Help the meadow: defeat 3 Green Slimes, then return to claim your reward.",
                    "Thank you for helping the meadow!",
                    "Quest complete! You received 100 EXP.")
    );
    private final Map<String, QuestDefinition> questsByNpcId = questsById.values().stream()
            .collect(java.util.stream.Collectors.toUnmodifiableMap(
                    QuestDefinition::npcId, definition -> definition));

    public QuestDefinition findById(String questId) { return questsById.get(questId); }
    public QuestDefinition findByNpcId(String npcId) { return questsByNpcId.get(npcId); }
    public Collection<QuestDefinition> all() { return questsById.values(); }
    public QuestDefinition defaultQuest() { return questsById.values().iterator().next(); }

    public record QuestDefinition(
            String questId,
            String npcId,
            String npcName,
            String targetMonsterType,
            String targetDisplayName,
            int requiredKills,
            int experienceReward,
            String startMessage,
            String claimedMessage,
            String completionMessage
    ) {
        public QuestDefinition {
            if (questId == null || questId.isBlank() || npcId == null || npcId.isBlank()
                    || npcName == null || npcName.isBlank() || targetMonsterType == null
                    || targetMonsterType.isBlank() || requiredKills < 1 || experienceReward < 0) {
                throw new IllegalArgumentException("Quest definition is invalid.");
            }
        }
    }
}
