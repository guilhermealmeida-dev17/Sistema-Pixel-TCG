package br.edu.fatecpg.api.auth;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() { }

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 300) String nome,
            @NotBlank @Email @Size(max = 300) String email,
            @NotBlank @Size(min = 11, max = 14) String cpf,
            @NotBlank @Size(min = 8, max = 72) String senha,
            @AssertTrue(message = "É necessário aceitar os Termos de Uso e a Política de Privacidade.")
            boolean termosAceitos
    ) { }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 300) String email,
            @NotBlank @Size(max = 72) String senha
    ) { }

    public record ProfileUpdateRequest(
            @Size(min = 2, max = 300) String nome,
            @Email @Size(max = 300) String email,
            @Size(min = 11, max = 14) String cpf,
            @Size(max = 20) String telefone,
            @Size(max = 100) String cidade,
            @Size(max = 300000) String urlImagem
    ) { }

    public record ChangePasswordRequest(
            @NotBlank @Size(max = 72) String senhaAtual,
            @NotBlank @Size(min = 8, max = 72) String novaSenha
    ) { }

    public record UserResponse(UUID id, String nome, String email, String cpf, String telefone,
                               String cidade, boolean admin, String urlImagem) { }

    public record AuthResponse(
            String tokenType,
            String accessToken,
            long expiresInSeconds,
            Instant expiresAt,
            UserResponse usuario
    ) { }

    public record ErrorResponse(String erro, String detalhe) { }
}
