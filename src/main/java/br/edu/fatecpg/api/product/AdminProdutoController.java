package br.edu.fatecpg.api.product;

import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.product.AdminProdutoDtos.CriarProdutoRequest;
import br.edu.fatecpg.api.product.AdminProdutoDtos.ProdutoResponse;
import br.edu.fatecpg.api.product.AdminProdutoDtos.StatusProdutoRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/produtos")
public class AdminProdutoController {
    private final AdminProdutoService service;

    public AdminProdutoController(AdminProdutoService service) { this.service = service; }

    @GetMapping
    public List<ProdutoResponse> listar() { return service.listar(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse cadastrar(@Valid @RequestBody CriarProdutoRequest request) {
        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public ProdutoResponse atualizar(@PathVariable UUID id, @Valid @RequestBody CriarProdutoRequest request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public ProdutoResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody StatusProdutoRequest request) {
        service.alterarStatus(id, request.ativo());
        return service.listar().stream().filter(item -> item.id().equals(id)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Produto não localizado após atualização."));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void arquivar(@PathVariable UUID id) { service.arquivar(id); }
}
