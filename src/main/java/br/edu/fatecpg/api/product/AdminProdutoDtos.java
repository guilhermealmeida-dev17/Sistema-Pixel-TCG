package br.edu.fatecpg.api.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AdminProdutoDtos {
    private AdminProdutoDtos() { }

    public record CriarProdutoRequest(
            @NotBlank @Size(max = 90) String nome,
            @Size(max = 90) String subtitulo,
            @NotBlank @Size(max = 50) String categoria,
            @NotBlank @Size(max = 150) String franquia,
            @Size(max = 90) String edicao,
            @Size(max = 20) String idioma,
            @NotNull @DecimalMin("0.01") @Digits(integer = 15, fraction = 4) BigDecimal preco,
            @NotNull @Min(0) Integer estoque,
            @Size(max = 50) String selo,
            @NotBlank @Size(min = 3, max = 15) String sku,
            @NotNull @Min(1) @Max(12) Integer parcelas,
            @NotNull @Min(0) Integer estoqueMinimo,
            @NotBlank @Size(max = 600) String descricao,
            @NotEmpty @Size(max = 5) List<@NotBlank @Size(max = 300000) @Pattern(regexp = "^(data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|https://[^\\s]+|/[^\\s]+)$", message = "Imagem deve ser Base64 de imagem, URL HTTPS ou caminho local.") String> imagens,
            @Size(max = 10) List<@Valid EspecificacaoRequest> especificacoes,
            @Size(max = 150) String detalhe
    ) { }

    public record StatusProdutoRequest(@NotNull Boolean ativo) { }

    public record EspecificacaoRequest(
            @NotBlank @Size(max = 90) String rotulo,
            @NotBlank @Size(max = 90) String valor
    ) { }

    public record EspecificacaoResponse(String rotulo, String valor) { }
    public record ProdutoResponse(UUID id, String nome, String subtitulo, String categoria, String franquia,
                                  String edicao, String idioma, BigDecimal preco, int estoque, String selo,
                                  String sku, int parcelas, int estoqueMinimo, String descricao,
                                  List<String> imagens, List<EspecificacaoResponse> especificacoes, boolean ativo) { }
    public record ProdutoPublicoResponse(UUID id, String nome, String subtitulo, String categoria, String franquia,
                                         String edicao, String idioma, BigDecimal preco, int estoque, String selo,
                                         int parcelas, String descricao, List<String> imagens,
                                         List<EspecificacaoResponse> especificacoes) { }
}
