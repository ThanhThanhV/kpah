package com.kpah.server.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService auth;
    private final AuthRateLimiter rateLimiter;

    public AuthController(AuthService auth, AuthRateLimiter rateLimiter) {
        this.auth = auth;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/register")
    public AuthService.AuthResponse register(@Valid @RequestBody Credentials request,
                                               HttpServletRequest servletRequest) {
        rateLimiter.checkRegistration(servletRequest.getRemoteAddr());
        return auth.register(request.email(), request.password());
    }

    @PostMapping("/login")
    public AuthService.AuthResponse login(@Valid @RequestBody Credentials request,
                                            HttpServletRequest servletRequest) {
        rateLimiter.checkLogin(servletRequest.getRemoteAddr());
        return auth.login(request.email(), request.password());
    }

    @GetMapping("/characters")
    public java.util.List<AuthService.CharacterSummary> characters(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        return auth.listCharacters(bearerToken(authorization));
    }

    @PostMapping("/characters")
    public AuthService.CharacterSummary createCharacter(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody CharacterRequest request) {
        return auth.createCharacter(bearerToken(authorization), request.name(), request.classCode());
    }

    @PostMapping("/select-character")
    public AuthService.AuthPrincipal selectCharacter(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody SelectCharacterRequest request) {
        return auth.selectCharacter(bearerToken(authorization), request.characterId());
    }

    @GetMapping("/me")
    public AuthService.AuthPrincipal me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        AuthService.AuthPrincipal principal = auth.authenticate(bearerToken(authorization));
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session is invalid or expired.");
        return principal;
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        auth.logout(bearerToken(authorization));
    }

    @PostMapping("/logout-all")
    public void logoutAll(@RequestHeader(name = "Authorization", required = false) String authorization) {
        AuthService.AuthPrincipal principal = auth.authenticate(bearerToken(authorization));
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session is invalid or expired.");
        }
        auth.logoutAllForAccount(principal.accountId());
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return null;
        return authorization.substring(7).trim();
    }

    public record Credentials(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 128) String password
    ) {}

    public record CharacterRequest(
            @NotBlank @Size(min = 3, max = 20) String name,
            @NotBlank String classCode
    ) {}

    public record SelectCharacterRequest(@NotBlank String characterId) {}
}
