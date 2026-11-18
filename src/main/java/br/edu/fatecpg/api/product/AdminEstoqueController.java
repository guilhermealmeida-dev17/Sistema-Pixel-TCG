package br.edu.fatecpg.api.product;

import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.product.EstoqueDtos.MovimentacaoRequest;
import br.edu.fatecpg.api.product.EstoqueDtos.MovimentacaoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/estoque")
public class AdminEstoqueController {
    private final AdminEstoqueService service;

    public AdminEstoqueController(AdminEstoqueService service) { this.service = service; }

    @GetMapping("/movimentacoes")
    public List<MovimentacaoResponse> listar(@RequestParam(required = false) UUID produtoId) {
        return service.listarMovimentacoes(produtoId);
    }

    @PostMapping("/produtos/{id}/movimentacoes")
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoResponse movimentar(@PathVariable UUID id,
                                           @Valid @RequestBody MovimentacaoRequest request) {
        return service.movimentar(id, request);
    }
}
