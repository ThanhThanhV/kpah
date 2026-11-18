package com.kpah.server.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    void deleteAllByAccountId(String accountId);
}
