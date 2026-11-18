package com.kpah.server.world;

import com.kpah.server.auth.SessionHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@EnableScheduling
public class WorldSocketConfiguration implements WebSocketConfigurer {
    private final WorldSocketHandler handler;
    private final SessionHandshakeInterceptor authInterceptor;

    public WorldSocketConfiguration(WorldSocketHandler handler, SessionHandshakeInterceptor authInterceptor) {
        this.handler = handler;
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/world")
                .addInterceptors(authInterceptor)
                .setAllowedOriginPatterns("*");
    }
}
