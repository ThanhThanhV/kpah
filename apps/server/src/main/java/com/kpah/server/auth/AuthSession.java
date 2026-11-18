package com.kpah.server.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "account_sessions")
public class AuthSession {
    @Id
    @Column(name = "token_hash", length = 64, nullable = false, updatable = false)
    private String tokenHash;

    @Column(name = "account_id", nullable = false, length = 36)
    private String accountId;

    @Column(name = "character_id", length = 36)
    private String characterId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected AuthSession() {}

    public AuthSession(String tokenHash, String accountId, String characterId, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.accountId = accountId;
        this.characterId = characterId;
        this.expiresAt = expiresAt;
    }

    public String getAccountId() { return accountId; }
    public String getCharacterId() { return characterId; }
    public Instant getExpiresAt() { return expiresAt; }
    public void selectCharacter(String nextCharacterId) { this.characterId = nextCharacterId; }
}
