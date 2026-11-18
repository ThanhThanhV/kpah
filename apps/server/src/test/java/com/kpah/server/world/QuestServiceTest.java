package com.kpah.server.world;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuestServiceTest {
    private static final String CHARACTER_ID = "character-1";
    private static final String QUEST_KEY = CHARACTER_ID + ":meadow-slime-hunt";

    @Mock private QuestProgressRepository progress;
    @Mock private StarterWorldRegistry worlds;
    private QuestService quests;

    @BeforeEach
    void setUp() {
        quests = new QuestService(progress, worlds, new QuestCatalog());
        WorldMapGeometry map = new WorldMapGeometry("starter-meadow", 1280, 704,
                640, 384, List.of(), List.of(),
                List.of(new NpcDefinition("6", "Meadow Guide", 704, 352, 32, 48)));
        when(worlds.require("starter-meadow")).thenReturn(map);
    }

    @Test
    void talkingToGuideStartsQuest() {
        when(progress.findById(QUEST_KEY)).thenReturn(Optional.empty());
        when(progress.save(any(QuestProgress.class))).thenAnswer(call -> call.getArgument(0));

        QuestService.QuestInteractionResult result =
                quests.interact(CHARACTER_ID, "starter-meadow", "6", 640, 384);

        assertEquals("active", result.status());
        assertEquals(0, result.progress());
        assertEquals(0, result.experienceReward());
        verify(progress).save(any(QuestProgress.class));
    }

    @Test
    void completedQuestCanBeClaimedOnceForOneHundredExperience() {
        QuestProgress saved = new QuestProgress(CHARACTER_ID, "meadow-slime-hunt");
        saved.increment();
        saved.increment();
        saved.increment();
        when(progress.findById(QUEST_KEY)).thenReturn(Optional.of(saved));
        when(progress.save(any(QuestProgress.class))).thenAnswer(call -> call.getArgument(0));

        QuestService.QuestInteractionResult result =
                quests.interact(CHARACTER_ID, "starter-meadow", "6", 640, 384);

        assertEquals("claimed", result.status());
        assertEquals(100, result.experienceReward());
        verify(progress).save(saved);
    }

    @Test
    void matchingMonsterKillAdvancesActiveQuest() {
        QuestProgress saved = new QuestProgress(CHARACTER_ID, "meadow-slime-hunt");
        when(progress.findById(QUEST_KEY)).thenReturn(Optional.of(saved));

        quests.onMonsterDefeated(CHARACTER_ID, "green-slime");

        assertEquals(1, saved.getProgress());
        verify(progress).save(saved);
    }

    @Test
    void unrelatedMonsterDoesNotAdvanceQuest() {
        when(progress.findById(QUEST_KEY)).thenReturn(Optional.empty());

        quests.onMonsterDefeated(CHARACTER_ID, "wolf");

        verify(progress, org.mockito.Mockito.never()).save(any(QuestProgress.class));
    }

    @Test
    void rejectsNpcInteractionOutsideRange() {
        assertThrows(IllegalArgumentException.class,
                () -> quests.interact(CHARACTER_ID, "starter-meadow", "6", 100, 100));
    }
}
