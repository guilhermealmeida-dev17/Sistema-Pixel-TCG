package br.edu.fatecpg.api.auth;

import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthDtos.AuthResponse;
import br.edu.fatecpg.api.auth.AuthDtos.ChangePasswordRequest;
import br.edu.fatecpg.api.auth.AuthDtos.LoginRequest;
import br.edu.fatecpg.api.auth.AuthDtos.ProfileUpdateRequest;
import br.edu.fatecpg.api.auth.AuthDtos.RegisterRequest;
import br.edu.fatecpg.api.auth.AuthDtos.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse cadastrar(@Valid @RequestBody RegisterRequest request) {
        return authService.cadastrar(request);
    }

    @PostMapping("/login")
    public AuthResponse entrar(@Valid @RequestBody LoginRequest request) {
        return authService.entrar(request);
    }

    @GetMapping("/me")
    public UserResponse minhaConta(@AuthenticationPrincipal Jwt jwt) {
        return authService.perfil(idUsuario(jwt));
    }

    @PatchMapping("/me")
    public UserResponse atualizarConta(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody ProfileUpdateRequest request) {
        return authService.atualizarPerfil(idUsuario(jwt), request);
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarSenha(@AuthenticationPrincipal Jwt jwt,
                             @Valid @RequestBody ChangePasswordRequest request) {
        authService.alterarSenha(idUsuario(jwt), request);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> excluirConta(@AuthenticationPrincipal Jwt jwt) {
        authService.excluirConta(idUsuario(jwt));
        return ResponseEntity.noContent().build();
    }

    private UUID idUsuario(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Token inválido.");
        }
    }
}
