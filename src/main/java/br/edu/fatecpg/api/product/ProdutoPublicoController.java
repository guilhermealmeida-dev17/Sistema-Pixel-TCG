package br.edu.fatecpg.api.product;

import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.product.AdminProdutoDtos.ProdutoPublicoResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoPublicoController {
    private final AdminProdutoService service;

    public ProdutoPublicoController(AdminProdutoService service) { this.service = service; }

    @GetMapping
    public List<ProdutoPublicoResponse> listar() { return service.listarPublico(); }

    @GetMapping("/{id}")
    public ProdutoPublicoResponse buscar(@PathVariable UUID id) { return service.buscarPublico(id); }
}
