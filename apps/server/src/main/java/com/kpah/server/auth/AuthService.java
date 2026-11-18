package com.kpah.server.auth;

import com.kpah.server.world.MovementService;
import com.kpah.server.world.PlayerCharacter;
import com.kpah.server.world.PlayerCharacterRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private static final Duration SESSION_LIFETIME = Duration.ofDays(30);
    private final AccountRepository accounts;
    private final AuthSessionRepository sessions;
    private final PlayerCharacterRepository characters;
    private final PasswordHasher passwords;
    private final MovementService movement;
    private final SecureRandom random = new SecureRandom();

    public AuthService(AccountRepository accounts, AuthSessionRepository sessions,
                       PlayerCharacterRepository characters, PasswordHasher passwords,
                       MovementService movement) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.characters = characters;
        this.passwords = passwords;
        this.movement = movement;
    }

    @Transactional
    public AuthResponse register(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        validatePassword(password);
        if (accounts.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }
        Account account = accounts.save(new Account(UUID.randomUUID().toString(), normalizedEmail,
                passwords.hash(password), Instant.now()));
        return issueSession(account);
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        Account account = accounts.findByEmailIgnoreCase(normalizedEmail)
                .filter(candidate -> passwords.matches(password, candidate.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));
        return issueSession(account);
    }

    @Transactional(readOnly = true)
    public AuthPrincipal authenticate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return null;
        AuthSession session = sessions.findById(hashToken(rawToken)).orElse(null);
        if (session == null || !session.getExpiresAt().isAfter(Instant.now())) return null;
        Account account = accounts.findById(session.getAccountId()).orElse(null);
        if (account == null) return null;
        PlayerCharacter character = characters.findFirstByAccountId(account.getId()).orElse(null);
        if (character == null) return null;
        return new AuthPrincipal(account.getId(), account.getEmail(), character.getId());
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) sessions.deleteById(hashToken(rawToken));
    }

    private AuthResponse issueSession(Account account) {
        PlayerCharacter character = characters.findFirstByAccountId(account.getId()).orElseGet(() -> {
            var spawn = movement.initialState("starter-meadow");
            return characters.save(PlayerCharacter.from(account.getId(), UUID.randomUUID().toString(),
                    spawn, 100, 0, Map.of("novice-sword", 1, "cloth-tunic", 1), Map.of()));
        });
        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        sessions.save(new AuthSession(hashToken(rawToken), account.getId(),
                Instant.now().plus(SESSION_LIFETIME)));
        return new AuthResponse(rawToken, account.getId(), account.getEmail(), character.getId(),
                Instant.now().plus(SESSION_LIFETIME).toString());
    }

    private String normalizeEmail(String email) {
        if (email == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        String normalized = email.trim().toLowerCase(java.util.Locale.ROOT);
        if (normalized.length() > 254 || !normalized.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        return normalized;
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 10 || password.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must contain between 10 and 128 characters.");
        }
    }

    private static String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    public record AuthResponse(String token, String accountId, String email,
                               String characterId, String expiresAt) {}
    public record AuthPrincipal(String accountId, String email, String characterId) {}
}
