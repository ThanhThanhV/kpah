package com.kpah.server.auth;

import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
public class SessionHandshakeInterceptor implements HandshakeInterceptor {
    private static final Logger log = LoggerFactory.getLogger(SessionHandshakeInterceptor.class);
    public static final String AUTH_TOKEN_ATTRIBUTE = "authToken";
    private static final String TOKEN_PROTOCOL_PREFIX = "auth.";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String protocols = request.getHeaders().getFirst("Sec-WebSocket-Protocol");
        String origin = request.getHeaders().getOrigin();
        if (protocols == null || protocols.isBlank()) {
            log.warn("Rejected world websocket handshake: missing auth subprotocol (origin={}).", origin);
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        String token = Arrays.stream(protocols.split(","))
                .map(String::trim)
                .filter(protocol -> protocol.startsWith(TOKEN_PROTOCOL_PREFIX))
                .map(protocol -> protocol.substring(TOKEN_PROTOCOL_PREFIX.length()))
                .filter(SessionHandshakeInterceptor::isSessionTokenShape)
                .findFirst().orElse(null);
        if (token == null) {
            log.warn("Rejected world websocket handshake: invalid auth subprotocol (origin={}, protocolPresent=true).", origin);
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        attributes.put(AUTH_TOKEN_ATTRIBUTE, token);
        return true;
    }

    private static boolean isSessionTokenShape(String token) {
        if (token.length() != 43) return false;
        try {
            return Base64.getUrlDecoder().decode(token).length == 32;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No post-handshake work is required.
    }
}
