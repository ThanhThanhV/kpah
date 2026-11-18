package com.kpah.server.auth;

import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {
    private static final int ITERATIONS = 210_000;
    private static final int KEY_LENGTH_BITS = 256;
    private static final int SALT_BYTES = 16;
    private final SecureRandom random = new SecureRandom();

    public String hash(String password) {
        byte[] salt = new byte[SALT_BYTES];
        random.nextBytes(salt);
        byte[] derived = derive(password, salt);
        return Base64.getEncoder().withoutPadding().encodeToString(salt) + ":"
                + Base64.getEncoder().withoutPadding().encodeToString(derived);
    }

    public boolean matches(String password, String encoded) {
        if (password == null || encoded == null) return false;
        String[] parts = encoded.split(":", -1);
        if (parts.length != 2) return false;
        try {
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            byte[] expected = Base64.getDecoder().decode(parts[1]);
            byte[] actual = derive(password, salt);
            if (expected.length != actual.length) return false;
            int difference = 0;
            for (int i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
            return difference == 0;
        } catch (IllegalArgumentException invalidEncoding) {
            return false;
        }
    }

    private byte[] derive(String password, byte[] salt) {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH_BITS);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Password hashing is unavailable.", exception);
        } finally {
            spec.clearPassword();
        }
    }
}
