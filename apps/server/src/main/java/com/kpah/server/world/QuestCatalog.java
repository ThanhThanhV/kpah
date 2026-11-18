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
    private final Map<String, List<QuestDefinition>> questsByNpcId;

    public QuestCatalog() {
        List<QuestDefinition> definitions = List.of(
                new QuestDefinition(
                        "meadow-slime-hunt", "6", "starter-meadow", "Meadow Guide",
                        "green-slime", "Green Slimes", 3, 100,
                        "Help the meadow: defeat 3 Green Slimes, then return to claim your reward.",
                        "Thank you for helping the meadow!",
                        "Quest complete! You received 100 EXP."),
                new QuestDefinition(
                        "forest-slime-hunt", "105", "forest-edge", "Forest Warden",
                        "green-slime", "Forest Green Slimes", 5, 180,
                        "The forest edge is overrun. Defeat 5 Green Slimes and report back.",
                        "The forest is safer thanks to you.",
                        "Forest secured! You received 180 EXP."),
                new QuestDefinition(
                        "forest-wolf-hunt", "105", "forest-edge", "Forest Warden",
                        "forest-wolf", "Forest Wolves", 3, 350,
                        "The Alpha Wolf's pack threatens the forest road. Defeat 3 Forest Wolves and report back.",
                        "The wolf threat has been dealt with.",
                        "Wolf hunt complete! You received 350 EXP."),
                new QuestDefinition(
                        "alpha-wolf-hunt", "105", "forest-edge", "Forest Warden",
                        "alpha-wolf", "Alpha Wolf", 1, 700,
                        "The Alpha Wolf has emerged from its lair. Defeat it and bring proof to the Warden.",
                        "The Alpha Wolf's threat has ended.",
                        "Alpha Wolf defeated! You received 700 EXP."),
                new QuestDefinition(
                        "ancient-guardian-hunt", "105", "forest-edge", "Forest Warden",
                        "ancient-guardian", "Ancient Guardian", 1, 1100,
                        "The Ancient Guardian has awakened beneath the old grove. Defeat it and bring back its core.",
                        "The grove is quiet again. You have my thanks.",
                        "Ancient Guardian defeated! You received 1100 EXP.")
        );
        this.definitions = List.copyOf(definitions);
        this.questsById = definitions.stream().collect(Collectors.toUnmodifiableMap(
                QuestDefinition::questId, Function.identity()));
        this.questsByNpcId = definitions.stream().collect(Collectors.groupingBy(
                QuestDefinition::npcId, Collectors.collectingAndThen(Collectors.toList(), List::copyOf)));
    }

    public QuestDefinition findById(String questId) { return questsById.get(questId); }
    public List<QuestDefinition> findByNpcId(String npcId) { return questsByNpcId.getOrDefault(npcId, List.of()); }
    public Collection<QuestDefinition> all() { return definitions; }
    public QuestDefinition defaultQuest() { return questsById.get("meadow-slime-hunt"); }

    public record QuestDefinition(
            String questId,
            String npcId,
            String targetMapId,
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
                    || targetMapId == null || targetMapId.isBlank() || npcName == null || npcName.isBlank() || targetMonsterType == null
                    || targetMonsterType.isBlank() || requiredKills < 1 || experienceReward < 0) {
                throw new IllegalArgumentException("Quest definition is invalid.");
            }
        }
    }
}
