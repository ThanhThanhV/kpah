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
import java.util.List;
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
        AuthSession session = validSession(rawToken);
        if (session == null) return null;
        Account account = accounts.findById(session.getAccountId()).orElse(null);
        if (account == null) return null;
        PlayerCharacter character = selectedCharacter(session);
        if (character == null || !account.getId().equals(character.getAccountId())) return null;
        return new AuthPrincipal(account.getId(), account.getEmail(), character.getId());
    }

    @Transactional(readOnly = true)
    public List<CharacterSummary> listCharacters(String rawToken) {
        AuthSession session = requireSession(rawToken);
        return characters.findAllByAccountIdOrderById(session.getAccountId()).stream()
                .map(this::summary).toList();
    }

    @Transactional
    public CharacterSummary createCharacter(String rawToken, String name, String classCode) {
        AuthSession session = requireSession(rawToken);
        List<PlayerCharacter> owned = characters.findAllByAccountIdOrderById(session.getAccountId());
        if (owned.size() >= 3) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account can have at most 3 characters.");
        }
        String normalizedName = normalizeCharacterName(name);
        String normalizedClass = normalizeClassCode(classCode);
        var spawn = movement.initialState("starter-meadow");
        PlayerCharacter created = characters.save(PlayerCharacter.from(
                session.getAccountId(), UUID.randomUUID().toString(), normalizedName, normalizedClass,
                spawn, 100, 0, Map.of("novice-sword", 1, "cloth-tunic", 1), Map.of()));
        return summary(created);
    }

    @Transactional
    public AuthPrincipal selectCharacter(String rawToken, String characterId) {
        AuthSession session = requireSession(rawToken);
        PlayerCharacter character = characters.findById(characterId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Character not found."));
        if (!session.getAccountId().equals(character.getAccountId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Character does not belong to this account.");
        }
        session.selectCharacter(characterId);
        sessions.save(session);
        Account account = accounts.findById(session.getAccountId()).orElseThrow();
        return new AuthPrincipal(account.getId(), account.getEmail(), character.getId());
    }

    private AuthSession validSession(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return null;
        AuthSession session = sessions.findById(hashToken(rawToken)).orElse(null);
        if (session == null || !session.getExpiresAt().isAfter(Instant.now())) return null;
        return session;
    }

    private AuthSession requireSession(String rawToken) {
        AuthSession session = validSession(rawToken);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session is invalid or expired.");
        }
        return session;
    }

    private PlayerCharacter selectedCharacter(AuthSession session) {
        if (session.getCharacterId() != null) {
            return characters.findById(session.getCharacterId()).orElse(null);
        }
        return characters.findFirstByAccountId(session.getAccountId()).orElse(null);
    }

    private CharacterSummary summary(PlayerCharacter character) {
        return new CharacterSummary(character.getId(), character.getName(), character.getClassCode(),
                character.getMapId(), character.getHp(), character.getExperience());
    }

    private String normalizeCharacterName(String name) {
        if (name == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Character name is required.");
        String normalized = name.trim();
        if (normalized.length() < 3 || normalized.length() > 20
                || !normalized.matches("^[\\p{L}\\p{N} _-]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Character name must be 3–20 letters, numbers, spaces, '_' or '-'.");
        }
        return normalized;
    }

    private String normalizeClassCode(String classCode) {
        String normalized = classCode == null ? "" : classCode.trim().toLowerCase(java.util.Locale.ROOT);
        if (!List.of("warrior", "mage", "archer").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose warrior, mage or archer.");
        }
        return normalized;
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) sessions.deleteById(hashToken(rawToken));
    }

    @Transactional
    public void logoutAllForAccount(String accountId) {
        sessions.deleteAllByAccountId(accountId);
    }

    private AuthResponse issueSession(Account account) {
        List<PlayerCharacter> owned = characters.findAllByAccountIdOrderById(account.getId());
        PlayerCharacter character;
        if (owned.isEmpty()) {
            var spawn = movement.initialState("starter-meadow");
            character = characters.save(PlayerCharacter.from(account.getId(), UUID.randomUUID().toString(),
                    "Adventurer", "warrior", spawn, 100, 0,
                    Map.of("novice-sword", 1, "cloth-tunic", 1), Map.of()));
        } else {
            character = owned.getFirst();
        }
        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        Instant expiresAt = Instant.now().plus(SESSION_LIFETIME);
        sessions.save(new AuthSession(hashToken(rawToken), account.getId(), character.getId(), expiresAt));
        return new AuthResponse(rawToken, account.getId(), account.getEmail(), character.getId(), expiresAt.toString());
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
    public record CharacterSummary(String characterId, String name, String classCode,
                                   String mapId, int hp, int experience) {}
}
