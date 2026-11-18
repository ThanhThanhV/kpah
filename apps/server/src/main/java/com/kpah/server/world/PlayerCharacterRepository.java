package com.kpah.server.world;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerCharacterRepository extends JpaRepository<PlayerCharacter, String> {
    Optional<PlayerCharacter> findFirstByAccountId(String accountId);
    List<PlayerCharacter> findAllByAccountIdOrderById(String accountId);
}
