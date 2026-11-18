package br.edu.fatecpg.api.product;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoqueEntity, UUID> {
    List<MovimentacaoEstoqueEntity> findTop100ByOrderByCriadoEmDesc();
    List<MovimentacaoEstoqueEntity> findTop100ByProduto_IdOrderByCriadoEmDesc(UUID produtoId);
}
