package br.edu.fatecpg.api.product;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface ProdutoRepository extends JpaRepository<ProdutoEntity, UUID> {
    boolean existsBySkuIgnoreCase(String sku);
    boolean existsBySkuIgnoreCaseAndIdNot(String sku, UUID id);
    List<ProdutoEntity> findAllByOrderByNomeAsc();
    List<ProdutoEntity> findAllByAtivoTrueOrderByNomeAsc();
    Optional<ProdutoEntity> findByIdAndAtivoTrue(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ProdutoEntity p where p.id = :id")
    Optional<ProdutoEntity> findByIdForUpdate(@Param("id") UUID id);
}
