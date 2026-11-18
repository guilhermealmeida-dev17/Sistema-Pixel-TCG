package br.edu.fatecpg.api.cart;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarrinhoRepository extends JpaRepository<CarrinhoEntity, UUID> {
    @EntityGraph(attributePaths = {"itens", "itens.produto"})
    Optional<CarrinhoEntity> findByUsuario_Id(UUID usuarioId);
}
