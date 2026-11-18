package com.kpah.server.world;

import com.kpah.server.auth.SessionHandshakeInterceptor;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
@EnableScheduling
public class WorldSocketConfiguration implements WebSocketConfigurer {
    private static final int MAX_MESSAGE_BYTES = 8 * 1024;

    private final WorldSocketHandler handler;
    private final SessionHandshakeInterceptor authInterceptor;
    private final List<String> allowedOriginPatterns;

    public WorldSocketConfiguration(
            WorldSocketHandler handler,
            SessionHandshakeInterceptor authInterceptor,
            @Value("${game.websocket.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*}")
            String allowedOriginPatterns) {
        this.handler = handler;
        this.authInterceptor = authInterceptor;
        this.allowedOriginPatterns = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        if (this.allowedOriginPatterns.isEmpty()) {
            throw new IllegalArgumentException("At least one WebSocket allowed-origin pattern must be configured.");
        }
    }

    @Bean
    public ServletServerContainerFactoryBean webSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(MAX_MESSAGE_BYTES);
        container.setMaxBinaryMessageBufferSize(MAX_MESSAGE_BYTES);
        container.setAsyncSendTimeout(10_000L);
        return container;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/world")
                .addInterceptors(authInterceptor)
                .setAllowedOriginPatterns(allowedOriginPatterns.toArray(String[]::new));
    }
}
