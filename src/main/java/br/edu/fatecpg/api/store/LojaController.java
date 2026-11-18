package br.edu.fatecpg.api.store;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthException;
import br.edu.fatecpg.api.store.EnderecoDtos.EnderecoRequest;
import br.edu.fatecpg.api.store.EnderecoDtos.PedidoRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LojaController {
    private final LojaService service;
    public LojaController(LojaService service) { this.service = service; }

    @GetMapping("/api/enderecos")
    public List<Map<String, Object>> enderecos(@AuthenticationPrincipal Jwt jwt) { return service.enderecos(usuarioId(jwt)); }

    @PostMapping("/api/enderecos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> criarEndereco(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody EnderecoRequest request) {
        return service.criarEndereco(usuarioId(jwt), request);
    }

    @DeleteMapping("/api/enderecos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirEndereco(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) { service.excluirEndereco(usuarioId(jwt), id); }

    @GetMapping("/api/pedidos")
    public List<Map<String, Object>> pedidos(@AuthenticationPrincipal Jwt jwt) { return service.pedidos(usuarioId(jwt)); }

    @PostMapping("/api/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> criarPedido(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PedidoRequest request) {
        return service.criarPedido(usuarioId(jwt), request);
    }

    @PostMapping("/api/pedidos/{id}/cancelamento")
    public Map<String, Object> cancelarPedido(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.cancelarPedido(usuarioId(jwt), id);
    }

    private UUID usuarioId(Jwt jwt) {
        try { return UUID.fromString(jwt.getSubject()); }
        catch (RuntimeException ex) { throw new AuthException(HttpStatus.UNAUTHORIZED, "Token inválido."); }
    }
}
