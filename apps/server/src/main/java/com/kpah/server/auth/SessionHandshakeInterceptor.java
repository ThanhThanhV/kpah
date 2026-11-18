package com.kpah.server.auth;

import java.util.Arrays;
import java.util.Map;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
public class SessionHandshakeInterceptor implements HandshakeInterceptor {
    public static final String AUTH_TOKEN_ATTRIBUTE = "authToken";
    private static final String TOKEN_PROTOCOL_PREFIX = "auth.";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String protocols = request.getHeaders().getFirst("Sec-WebSocket-Protocol");
        if (protocols == null || protocols.isBlank()) return false;
        String token = Arrays.stream(protocols.split(","))
                .map(String::trim)
                .filter(protocol -> protocol.startsWith(TOKEN_PROTOCOL_PREFIX))
                .map(protocol -> protocol.substring(TOKEN_PROTOCOL_PREFIX.length()))
                .filter(value -> value.length() >= 40 && value.length() <= 64)
                .findFirst().orElse(null);
        if (token == null) return false;
        attributes.put(AUTH_TOKEN_ATTRIBUTE, token);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No post-handshake work is required.
    }
}
