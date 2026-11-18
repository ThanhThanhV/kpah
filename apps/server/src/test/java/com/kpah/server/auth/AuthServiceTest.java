package com.kpah.server.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.kpah.server.world.MovementService;
import com.kpah.server.world.PlayerCharacter;
import com.kpah.server.world.PlayerCharacterRepository;
import com.kpah.server.world.PlayerMotionState;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AuthServiceTest {
    @Test
    void registrationCreatesOwnedCharacterAndOpaqueSession() {
        AccountRepository accounts = mock(AccountRepository.class);
        AuthSessionRepository sessions = mock(AuthSessionRepository.class);
        PlayerCharacterRepository characters = mock(PlayerCharacterRepository.class);
        PasswordHasher passwords = new PasswordHasher();
        MovementService movement = mock(MovementService.class);

        when(accounts.existsByEmailIgnoreCase("player@example.com")).thenReturn(false);
        when(accounts.save(any(Account.class))).thenAnswer(call -> call.getArgument(0));
        when(characters.findAllByAccountIdOrderById(any())).thenReturn(java.util.List.of());
        when(movement.initialState("starter-meadow"))
                .thenReturn(new PlayerMotionState("starter-meadow", 640, 384, 0));
        when(characters.save(any(PlayerCharacter.class))).thenAnswer(call -> call.getArgument(0));
        when(sessions.save(any(AuthSession.class))).thenAnswer(call -> call.getArgument(0));

        AuthService service = new AuthService(accounts, sessions, characters, passwords, movement);
        AuthService.AuthResponse response = service.register(" Player@Example.com ", "a-long-test-password");

        assertNotNull(response.token());
        assertEquals("player@example.com", response.email());
        assertNotNull(response.characterId());

        ArgumentCaptor<PlayerCharacter> character = ArgumentCaptor.forClass(PlayerCharacter.class);
        verify(characters).save(character.capture());
        assertEquals(response.accountId(), character.getValue().getAccountId());
        assertEquals(response.characterId(), character.getValue().getId());
        verify(sessions).save(any(AuthSession.class));
    }
}
