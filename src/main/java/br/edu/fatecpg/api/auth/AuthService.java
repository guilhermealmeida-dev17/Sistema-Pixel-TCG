package br.edu.fatecpg.api.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthDtos.AuthResponse;
import br.edu.fatecpg.api.auth.AuthDtos.ChangePasswordRequest;
import br.edu.fatecpg.api.auth.AuthDtos.LoginRequest;
import br.edu.fatecpg.api.auth.AuthDtos.ProfileUpdateRequest;
import br.edu.fatecpg.api.auth.AuthDtos.RegisterRequest;
import br.edu.fatecpg.api.auth.AuthDtos.UserResponse;
import br.edu.fatecpg.api.user.Usuario;
import br.edu.fatecpg.api.user.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final String TERMS_VERSION = "pixel-tcg-2026-11-v1";

    private final UsuarioRepository usuarios;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long tokenMinutes;

    public AuthService(
            UsuarioRepository usuarios,
            JdbcTemplate jdbc,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.access-token-minutes}") long tokenMinutes
    ) {
        this.usuarios = usuarios;
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.tokenMinutes = tokenMinutes;
    }

    @Transactional
    public UserResponse cadastrar(RegisterRequest request) {
        String email = normalizarEmail(request.email());
        String cpf = somenteDigitos(request.cpf());
        validarSenhaUtf8(request.senha());
        if (!cpfValido(cpf)) throw new AuthException(HttpStatus.BAD_REQUEST, "CPF inválido.");
        if (!request.termosAceitos()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "É necessário aceitar os Termos de Uso e a Política de Privacidade.");
        }
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail.");
        }
        if (usuarios.existsByCpf(cpf)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe uma conta com este CPF.");
        }

        Usuario usuario = usuarios.save(new Usuario(
                request.nome().trim(), email, passwordEncoder.encode(request.senha()), cpf, TERMS_VERSION
        ));
        return paraResposta(usuario);
    }

    @Transactional(readOnly = true)
    public AuthResponse entrar(LoginRequest request) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(normalizarEmail(request.email()))
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }
        return criarToken(usuario);
    }

    @Transactional(readOnly = true)
    public UserResponse perfil(UUID id) {
        return paraResposta(buscarUsuario(id));
    }

    @Transactional
    public UserResponse atualizarPerfil(UUID id, ProfileUpdateRequest request) {
        Usuario usuario = buscarUsuario(id);
        String nome = request.nome() == null ? usuario.getNome() : request.nome().trim();
        String email = request.email() == null ? usuario.getEmail() : normalizarEmail(request.email());
        if (nome.length() < 2) throw new AuthException(HttpStatus.BAD_REQUEST, "Informe seu nome completo.");
        if (email.isBlank() || email.length() > 300 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Informe um e-mail válido.");
        }
        String cpf = usuario.getCpf();

        if (request.cpf() != null && !request.cpf().isBlank()) {
            String novoCpf = somenteDigitos(request.cpf());
            if (!cpfValido(novoCpf)) throw new AuthException(HttpStatus.BAD_REQUEST, "CPF inválido.");
            if (cpf != null && !cpf.equals(novoCpf)) {
                throw new AuthException(HttpStatus.BAD_REQUEST, "O CPF já cadastrado não pode ser alterado.");
            }
            cpf = novoCpf;
        }
        if (!email.equalsIgnoreCase(usuario.getEmail()) && usuarios.existsByEmailIgnoreCase(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail.");
        }
        if (cpf != null && !cpf.equals(usuario.getCpf()) && usuarios.existsByCpf(cpf)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe uma conta com este CPF.");
        }

        String telefone = request.telefone() == null ? usuario.getTelefone() : request.telefone().trim();
        if (telefone != null && !telefone.isBlank()) {
            String digitosTelefone = somenteDigitos(telefone);
            if (digitosTelefone.length() < 10 || digitosTelefone.length() > 11) {
                throw new AuthException(HttpStatus.BAD_REQUEST, "O telefone precisa incluir DDD e ter 10 ou 11 dígitos.");
            }
        }
        String cidade = request.cidade() == null ? usuario.getCidade() : request.cidade().trim();
        String imagem = request.urlImagem() == null ? usuario.getUrlImagem()
                : request.urlImagem().isBlank() ? null : request.urlImagem();
        usuario.atualizarPerfil(nome, email, cpf, telefone, cidade, imagem);
        return paraResposta(usuarios.save(usuario));
    }

    @Transactional
    public void alterarSenha(UUID id, ChangePasswordRequest request) {
        Usuario usuario = buscarUsuario(id);
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "A senha atual não confere.");
        }
        validarSenhaUtf8(request.novaSenha());
        usuario.alterarSenha(passwordEncoder.encode(request.novaSenha()));
        usuarios.save(usuario);
    }

    @Transactional
    public void excluirConta(UUID id) {
        List<UUID> pendentes = jdbc.query("""
                SELECT id_pedido FROM pedido
                WHERE id_usuario = ? AND nm_status_pedido = 'AGUARDANDO_PAGAMENTO'
                FOR UPDATE
                """, (rs, row) -> rs.getObject(1, UUID.class), id);
        for (UUID pedidoId : pendentes) {
            jdbc.update("""
                    UPDATE produto p SET qt_estoque_produto = p.qt_estoque_produto + pp.qt_produto_pedido
                    FROM produto_pedido pp WHERE pp.id_produto = p.id_produto AND pp.id_pedido = ?
                    """, pedidoId);
            jdbc.update("""
                    UPDATE pedido SET nm_status_pedido = 'CANCELADO', dt_atualizacao_pedido = CURRENT_TIMESTAMP
                    WHERE id_pedido = ?
                    """, pedidoId);
        }
        usuarios.delete(buscarUsuario(id));
    }

    private AuthResponse criarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plus(tokenMinutes, ChronoUnit.MINUTES);
        List<String> roles = usuario.isAdmin() ? List.of("ROLE_ADMIN", "ROLE_USER") : List.of("ROLE_USER");
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(agora)
                .expiresAt(expiraEm)
                .subject(usuario.getId().toString())
                .claim("roles", roles)
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims
        )).getTokenValue();
        return new AuthResponse("Bearer", token, tokenMinutes * 60, expiraEm, paraResposta(usuario));
    }

    private UserResponse paraResposta(Usuario usuario) {
        return new UserResponse(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getCpf(),
                usuario.getTelefone(), usuario.getCidade(), usuario.isAdmin(), usuario.getUrlImagem());
    }

    private Usuario buscarUsuario(UUID id) {
        return usuarios.findById(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Conta não encontrada."));
    }

    private String normalizarEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private String somenteDigitos(String valor) { return valor == null ? "" : valor.replaceAll("\\D", ""); }

    private void validarSenhaUtf8(String senha) {
        if (senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "A senha deve ter no máximo 72 bytes em UTF-8.");
        }
        if (!senha.matches("(?s).*[A-Za-z].*") || !senha.matches("(?s).*\\d.*")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "A senha precisa conter letras e números.");
        }
    }

    private boolean cpfValido(String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}") || cpf.chars().distinct().count() == 1) return false;
        int soma = 0;
        for (int i = 0; i < 9; i++) soma += (cpf.charAt(i) - '0') * (10 - i);
        int primeiro = (soma * 10) % 11;
        if (primeiro == 10) primeiro = 0;
        soma = 0;
        for (int i = 0; i < 10; i++) soma += (cpf.charAt(i) - '0') * (11 - i);
        int segundo = (soma * 10) % 11;
        if (segundo == 10) segundo = 0;
        return primeiro == cpf.charAt(9) - '0' && segundo == cpf.charAt(10) - '0';
    }
}
