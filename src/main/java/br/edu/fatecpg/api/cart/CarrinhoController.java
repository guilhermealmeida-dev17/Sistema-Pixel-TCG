package br.edu.fatecpg.api.cart;

import java.util.UUID;

import br.edu.fatecpg.api.cart.CarrinhoDtos.CarrinhoResponse;
import br.edu.fatecpg.api.cart.CarrinhoDtos.ItemRequest;
import br.edu.fatecpg.api.cart.CarrinhoDtos.QuantidadeRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/carrinho")
public class CarrinhoController {
    private final CarrinhoService service;

    public CarrinhoController(CarrinhoService service) { this.service = service; }

    @GetMapping
    public CarrinhoResponse consultar(@AuthenticationPrincipal Jwt jwt) {
        return service.consultar(usuarioId(jwt));
    }

    @PostMapping("/itens")
    @ResponseStatus(HttpStatus.OK)
    public CarrinhoResponse adicionar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ItemRequest request) {
        return service.adicionar(usuarioId(jwt), request);
    }

    @PutMapping("/itens/{produtoId}")
    public CarrinhoResponse definirQuantidade(@AuthenticationPrincipal Jwt jwt,
                                               @PathVariable UUID produtoId,
                                               @Valid @RequestBody QuantidadeRequest request) {
        return service.definirQuantidade(usuarioId(jwt), produtoId, request.quantidade());
    }

    @DeleteMapping("/itens/{produtoId}")
    public CarrinhoResponse remover(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID produtoId) {
        return service.remover(usuarioId(jwt), produtoId);
    }

    @DeleteMapping("/itens")
    public CarrinhoResponse limpar(@AuthenticationPrincipal Jwt jwt) {
        return service.limpar(usuarioId(jwt));
    }

    private UUID usuarioId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new br.edu.fatecpg.api.auth.AuthException(HttpStatus.UNAUTHORIZED, "Token inválido.");
        }
    }
}
