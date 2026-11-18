package br.edu.fatecpg.api.store;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class EnderecoDtos {
    private EnderecoDtos() { }

    public record EnderecoRequest(
            @NotBlank @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$") String cep,
            @NotBlank @Size(max = 150) String rua,
            @NotBlank @Size(max = 20) String numero,
            @Size(max = 100) String complemento,
            @NotBlank @Size(max = 100) String bairro,
            @NotBlank @Size(max = 100) String cidade,
            @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String uf
    ) { }

    public record PedidoRequest(
            @NotBlank @Size(max = 30) String entrega,
            @NotBlank String enderecoId
    ) { }
}
