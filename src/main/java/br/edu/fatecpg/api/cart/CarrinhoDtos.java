package br.edu.fatecpg.api.cart;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public final class CarrinhoDtos {
    private CarrinhoDtos() { }

    public record ItemRequest(@NotNull UUID produtoId, @NotNull @Min(1) Integer quantidade) { }
    public record QuantidadeRequest(@NotNull @Min(1) Integer quantidade) { }
    public record ItemResponse(UUID produtoId, String nome, String sku, BigDecimal precoUnitario,
                               int quantidade, BigDecimal subtotal, List<String> imagens) { }
    public record CarrinhoResponse(UUID id, List<ItemResponse> itens, int quantidadeItens,
                                   BigDecimal subtotal) { }
}
