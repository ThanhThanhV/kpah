package com.kpah.server.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {
    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void hashesPasswordsWithUniqueSaltsAndVerifiesOnlyMatchingPassword() {
        String first = hasher.hash("correct horse battery");
        String second = hasher.hash("correct horse battery");

        assertNotEquals(first, second);
        assertTrue(hasher.matches("correct horse battery", first));
        assertFalse(hasher.matches("incorrect password", first));
    }
}
