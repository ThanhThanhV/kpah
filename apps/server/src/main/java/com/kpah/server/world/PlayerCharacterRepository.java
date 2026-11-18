package com.kpah.server.world;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerCharacterRepository extends JpaRepository<PlayerCharacter, String> {
    Optional<PlayerCharacter> findFirstByAccountId(String accountId);
}
