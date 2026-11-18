package com.kpah.server.world;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "character_quest_progress")
public class QuestProgress {
    @Id
    @Column(length = 80, nullable = false, updatable = false)
    private String id;

    @Column(name = "character_id", nullable = false, length = 36)
    private String characterId;

    @Column(name = "quest_id", nullable = false, length = 80)
    private String questId;

    @Column(nullable = false)
    private int progress;

    @Column(nullable = false)
    private boolean claimed;

    protected QuestProgress() {
    }

    public QuestProgress(String characterId, String questId) {
        this.id = characterId + ":" + questId;
        this.characterId = characterId;
        this.questId = questId;
        this.progress = 0;
        this.claimed = false;
    }

    public void increment() { increment(3); }
    public void increment(int required) {
        if (required < 1) throw new IllegalArgumentException("Required quest progress must be positive.");
        if (!claimed) progress = Math.min(required, progress + 1);
    }
    public void claim() { claimed = true; }
    public String getCharacterId() { return characterId; }
    public String getQuestId() { return questId; }
    public int getProgress() { return progress; }
    public boolean isClaimed() { return claimed; }
}
