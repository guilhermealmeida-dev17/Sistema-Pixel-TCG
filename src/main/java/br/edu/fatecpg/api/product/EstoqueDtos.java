package br.edu.fatecpg.api.product;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class EstoqueDtos {
    private EstoqueDtos() { }

    public record MovimentacaoRequest(
            @NotBlank @Pattern(regexp = "ENTRADA|SAIDA|AJUSTE", message = "Tipo deve ser ENTRADA, SAIDA ou AJUSTE.")
            String tipo,
            @NotNull @Min(1) Integer quantidade,
            @Size(max = 250) String motivo
    ) { }

    public record MovimentacaoResponse(
            UUID id, UUID produtoId, String produtoNome, String sku, String tipo,
            int quantidade, int estoqueAnterior, int estoquePosterior,
            String motivo, LocalDateTime criadoEm
    ) { }
}
