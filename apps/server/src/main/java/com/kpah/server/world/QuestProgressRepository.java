package com.kpah.server.world;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestProgressRepository extends JpaRepository<QuestProgress, String> {
    List<QuestProgress> findAllByCharacterId(String characterId);
}
