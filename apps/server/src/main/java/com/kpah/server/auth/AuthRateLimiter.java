package com.kpah.server.auth;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AuthRateLimiter {
    private static final int MAX_TRACKED_KEYS = 5_000;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public void checkLogin(String remoteAddress) {
        check("login", remoteAddress, 8, Duration.ofMinutes(15));
    }

    public void checkRegistration(String remoteAddress) {
        check("register", remoteAddress, 4, Duration.ofHours(1));
    }

    private void check(String action, String remoteAddress, int limit, Duration duration) {
        String address = remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress;
        String key = action + ":" + address;
        if (!windows.containsKey(key) && windows.size() >= MAX_TRACKED_KEYS) pruneExpired();
        if (!windows.containsKey(key) && windows.size() >= MAX_TRACKED_KEYS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Authentication is temporarily busy. Try again later.");
        }
        Window window = windows.computeIfAbsent(key, ignored -> new Window());
        long now = System.currentTimeMillis();
        long cutoff = now - duration.toMillis();
        synchronized (window) {
            while (!window.attempts.isEmpty() && window.attempts.peekFirst() < cutoff) {
                window.attempts.removeFirst();
            }
            if (window.attempts.size() >= limit) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many authentication attempts. Try again later.");
            }
            window.attempts.addLast(now);
        }
    }

    private void pruneExpired() {
        long cutoff = System.currentTimeMillis() - Duration.ofHours(1).toMillis();
        windows.entrySet().removeIf(entry -> {
            Window window = entry.getValue();
            synchronized (window) {
                while (!window.attempts.isEmpty() && window.attempts.peekFirst() < cutoff) {
                    window.attempts.removeFirst();
                }
                return window.attempts.isEmpty();
            }
        });
    }

    private static final class Window {
        private final ArrayDeque<Long> attempts = new ArrayDeque<>();
    }
}
