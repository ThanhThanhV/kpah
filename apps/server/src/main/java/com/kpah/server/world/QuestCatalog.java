package com.kpah.server.world;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class QuestCatalog {
    private final List<QuestDefinition> definitions;
    private final Map<String, QuestDefinition> questsById;
    private final Map<String, QuestDefinition> questsByNpcId;

    public QuestCatalog() {
        List<QuestDefinition> definitions = List.of(
                new QuestDefinition(
                        "meadow-slime-hunt", "6", "Meadow Guide",
                        "green-slime", "Green Slimes", 3, 100,
                        "Help the meadow: defeat 3 Green Slimes, then return to claim your reward.",
                        "Thank you for helping the meadow!",
                        "Quest complete! You received 100 EXP."),
                new QuestDefinition(
                        "forest-slime-hunt", "105", "Forest Warden",
                        "green-slime", "Forest Green Slimes", 5, 180,
                        "The forest edge is overrun. Defeat 5 Green Slimes and report back.",
                        "The forest is safer thanks to you.",
                        "Forest secured! You received 180 EXP.")
        );
        this.definitions = List.copyOf(definitions);
        this.questsById = definitions.stream().collect(Collectors.toUnmodifiableMap(
                QuestDefinition::questId, Function.identity()));
        this.questsByNpcId = definitions.stream().collect(Collectors.toUnmodifiableMap(
                QuestDefinition::npcId, Function.identity()));
    }

    public QuestDefinition findById(String questId) { return questsById.get(questId); }
    public QuestDefinition findByNpcId(String npcId) { return questsByNpcId.get(npcId); }
    public Collection<QuestDefinition> all() { return definitions; }
    public QuestDefinition defaultQuest() { return questsById.get("meadow-slime-hunt"); }

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
