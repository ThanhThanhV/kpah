package com.kpah.server.auth;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class AuthRateLimiterTest {
    @Test
    void blocksTheNinthLoginAttemptFromOneAddress() {
        AuthRateLimiter limiter = new AuthRateLimiter();
        for (int attempt = 0; attempt < 8; attempt++) limiter.checkLogin("192.0.2.10");

        assertThrows(ResponseStatusException.class, () -> limiter.checkLogin("192.0.2.10"));
    }

    @Test
    void limitsAccountRegistrationMoreStrictlyThanLogin() {
        AuthRateLimiter limiter = new AuthRateLimiter();
        for (int attempt = 0; attempt < 4; attempt++) limiter.checkRegistration("192.0.2.20");

        assertThrows(ResponseStatusException.class, () -> limiter.checkRegistration("192.0.2.20"));
    }
}
