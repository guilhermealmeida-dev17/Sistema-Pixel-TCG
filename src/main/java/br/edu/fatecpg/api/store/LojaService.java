package br.edu.fatecpg.api.store;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthException;
import br.edu.fatecpg.api.store.EnderecoDtos.EnderecoRequest;
import br.edu.fatecpg.api.store.EnderecoDtos.PedidoRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LojaService {
    private final JdbcTemplate jdbc;

    public LojaService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> enderecos(UUID usuarioId) {
        return jdbc.query("""
                SELECT id_endereco_usuario, cd_cep_endereco, nm_rua_endereco, nr_endereco,
                       tx_complemento_endereco, nm_bairro_endereco, nm_cidade_endereco, sg_estado_endereco
                FROM endereco_usuario WHERE id_usuario = ? ORDER BY nm_rua_endereco, nr_endereco
                """, this::enderecoRow, usuarioId);
    }

    @Transactional
    public Map<String, Object> criarEndereco(UUID usuarioId, EnderecoRequest request) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO endereco_usuario
                    (id_endereco_usuario, id_usuario, cd_cep_endereco, nm_rua_endereco, nr_endereco,
                     tx_complemento_endereco, nm_bairro_endereco, nm_cidade_endereco, sg_estado_endereco)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, usuarioId, cep(request.cep()), request.rua().trim(), request.numero().trim(),
                vazioNulo(request.complemento()), request.bairro().trim(), request.cidade().trim(), request.uf().toUpperCase());
        return buscarEndereco(usuarioId, id);
    }

    @Transactional
    public void excluirEndereco(UUID usuarioId, UUID enderecoId) {
        int removidos = jdbc.update("DELETE FROM endereco_usuario WHERE id_endereco_usuario = ? AND id_usuario = ?", enderecoId, usuarioId);
        if (removidos == 0) throw new AuthException(HttpStatus.NOT_FOUND, "Endereço não encontrado.");
    }

    @Transactional
    public Map<String, Object> criarPedido(UUID usuarioId, PedidoRequest request) {
        UUID enderecoId = parseUuid(request.enderecoId(), "Endereço inválido.");
        Map<String, Object> endereco = buscarEndereco(usuarioId, enderecoId);
        jdbc.query("SELECT id_carrinho FROM carrinho WHERE id_usuario = ? FOR UPDATE", (rs, row) -> rs.getObject(1), usuarioId);
        List<Map<String, Object>> itens = jdbc.query("""
                SELECT p.id_produto, p.nm_produto, p.cd_sku_produto, p.vl_produto, p.qt_estoque_produto,
                       p.ic_ativo_produto, cp.qt_produto_carrinho
                FROM carrinho c
                JOIN carrinho_produto cp ON cp.id_carrinho = c.id_carrinho
                JOIN produto p ON p.id_produto = cp.id_produto
                WHERE c.id_usuario = ?
                ORDER BY p.id_produto FOR UPDATE OF p
                """, (rs, row) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id_produto", UUID.class));
                    item.put("nome", rs.getString("nm_produto"));
                    item.put("sku", rs.getString("cd_sku_produto"));
                    item.put("preco", rs.getBigDecimal("vl_produto"));
                    item.put("estoque", rs.getInt("qt_estoque_produto"));
                    item.put("ativo", rs.getBoolean("ic_ativo_produto"));
                    item.put("quantidade", rs.getInt("qt_produto_carrinho"));
                    return item;
                }, usuarioId);
        if (itens.isEmpty()) throw new AuthException(HttpStatus.BAD_REQUEST, "Seu carrinho está vazio ou contém produtos indisponíveis.");

        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> item : itens) {
            if (!(Boolean) item.get("ativo")) throw new AuthException(HttpStatus.CONFLICT, "O produto " + item.get("nome") + " não está mais disponível.");
            int qtd = (Integer) item.get("quantidade");
            int estoque = (Integer) item.get("estoque");
            if (qtd > estoque) throw new AuthException(HttpStatus.CONFLICT, "Estoque insuficiente para " + item.get("nome") + ".");
            total = total.add(((BigDecimal) item.get("preco")).multiply(BigDecimal.valueOf(qtd)));
        }

        UUID pedidoId = UUID.randomUUID();
        String tipoEntrega = request.entrega().trim();
        if (!List.of("ENTREGA", "RETIRADA").contains(tipoEntrega.toUpperCase())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Escolha entrega ou retirada.");
        }
        jdbc.update("""
                INSERT INTO pedido (id_pedido, id_usuario, cd_cep_endereco_pedido, nm_rua_endereco_pedido,
                    nr_endereco_pedido, tx_complemento_endereco_pedido, nm_bairro_endereco_pedido,
                    nm_cidade_endereco_pedido, sg_estado_endereco_pedido, nm_tipo_entrega_pedido,
                    vl_total_pedido, nm_status_pedido)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AGUARDANDO_PAGAMENTO')
                """, pedidoId, usuarioId, endereco.get("cep"), endereco.get("rua"), endereco.get("numero"),
                endereco.get("complemento"), endereco.get("bairro"), endereco.get("cidade"), endereco.get("uf"),
                tipoEntrega.toUpperCase(), total);

        for (Map<String, Object> item : itens) {
            UUID produtoId = (UUID) item.get("id");
            int quantidade = (Integer) item.get("quantidade");
            jdbc.update("""
                    INSERT INTO produto_pedido (id_produto_pedido, id_produto, id_pedido,
                        qt_produto_pedido, vl_unitario_produto_pedido)
                    VALUES (?, ?, ?, ?, ?)
                    """, UUID.randomUUID(), produtoId, pedidoId, quantidade, item.get("preco"));
            int estoqueAnterior = (Integer) item.get("estoque");
            int estoquePosterior = estoqueAnterior - quantidade;
            jdbc.update("UPDATE produto SET qt_estoque_produto = ? WHERE id_produto = ?", estoquePosterior, produtoId);
            registrarMovimentacaoEstoque(produtoId, "SAIDA", quantidade, estoqueAnterior, estoquePosterior,
                    "Venda - pedido " + pedidoId);
        }
        jdbc.update("DELETE FROM carrinho_produto WHERE id_carrinho = (SELECT id_carrinho FROM carrinho WHERE id_usuario = ?)", usuarioId);
        return buscarPedido(usuarioId, pedidoId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> pedidos(UUID usuarioId) {
        List<Map<String, Object>> out = jdbc.query("""
                SELECT id_pedido, dt_criacao_pedido, nm_tipo_entrega_pedido, vl_total_pedido,
                       nm_status_pedido, cd_cep_endereco_pedido, nm_rua_endereco_pedido,
                       nr_endereco_pedido, tx_complemento_endereco_pedido, nm_bairro_endereco_pedido,
                       nm_cidade_endereco_pedido, sg_estado_endereco_pedido
                FROM pedido WHERE id_usuario = ? ORDER BY dt_criacao_pedido DESC
                """, (rs, row) -> pedidoRow(rs), usuarioId);
        for (Map<String, Object> pedido : out) pedido.put("itens", itensPedido((UUID) pedido.get("id")));
        return out;
    }

    @Transactional
    public Map<String, Object> cancelarPedido(UUID usuarioId, UUID pedidoId) {
        List<String> status = jdbc.query("SELECT nm_status_pedido FROM pedido WHERE id_pedido = ? AND id_usuario = ? FOR UPDATE",
                (rs, row) -> rs.getString(1), pedidoId, usuarioId);
        if (status.isEmpty()) throw new AuthException(HttpStatus.NOT_FOUND, "Pedido não encontrado.");
        if (!"AGUARDANDO_PAGAMENTO".equals(status.get(0))) throw new AuthException(HttpStatus.CONFLICT, "Este pedido não pode mais ser cancelado.");
        List<Map<String, Object>> linhas = jdbc.query("""
                SELECT p.id_produto, p.qt_estoque_produto, pp.qt_produto_pedido
                FROM produto_pedido pp
                JOIN produto p ON p.id_produto = pp.id_produto
                WHERE pp.id_pedido = ?
                ORDER BY p.id_produto
                FOR UPDATE OF p
                """, (rs, row) -> {
                    Map<String, Object> linha = new LinkedHashMap<>();
                    linha.put("produto", rs.getObject("id_produto", UUID.class));
                    linha.put("qtd", rs.getInt("qt_produto_pedido"));
                    linha.put("estoque", rs.getInt("qt_estoque_produto"));
                    return linha;
                }, pedidoId);
        for (Map<String, Object> linha : linhas) {
            UUID produtoId = (UUID) linha.get("produto");
            int quantidade = (Integer) linha.get("qtd");
            int estoqueAnterior = (Integer) linha.get("estoque");
            int estoquePosterior = estoqueAnterior + quantidade;
            jdbc.update("UPDATE produto SET qt_estoque_produto = ? WHERE id_produto = ?", estoquePosterior, produtoId);
            registrarMovimentacaoEstoque(produtoId, "ENTRADA", quantidade, estoqueAnterior, estoquePosterior,
                    "Cancelamento do pedido " + pedidoId);
        }
        jdbc.update("UPDATE pedido SET nm_status_pedido = 'CANCELADO', dt_atualizacao_pedido = CURRENT_TIMESTAMP WHERE id_pedido = ?", pedidoId);
        return buscarPedido(usuarioId, pedidoId);
    }

    private void registrarMovimentacaoEstoque(UUID produtoId, String tipo, int quantidade,
                                                int estoqueAnterior, int estoquePosterior, String motivo) {
        jdbc.update("""
                INSERT INTO movimentacao_estoque
                    (id_movimentacao_estoque, id_produto, nm_tipo_movimentacao, qt_movimentada,
                     qt_estoque_anterior, qt_estoque_posterior, ds_motivo, dt_criacao)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, UUID.randomUUID(), produtoId, tipo, quantidade, estoqueAnterior, estoquePosterior, motivo);
    }

    private Map<String, Object> buscarPedido(UUID usuarioId, UUID pedidoId) {
        List<Map<String, Object>> rows = jdbc.query("""
                SELECT id_pedido, dt_criacao_pedido, nm_tipo_entrega_pedido, vl_total_pedido,
                       nm_status_pedido, cd_cep_endereco_pedido, nm_rua_endereco_pedido,
                       nr_endereco_pedido, tx_complemento_endereco_pedido, nm_bairro_endereco_pedido,
                       nm_cidade_endereco_pedido, sg_estado_endereco_pedido
                FROM pedido WHERE id_pedido = ? AND id_usuario = ?
                """, (rs, row) -> pedidoRow(rs), pedidoId, usuarioId);
        if (rows.isEmpty()) throw new AuthException(HttpStatus.NOT_FOUND, "Pedido não encontrado.");
        Map<String, Object> pedido = rows.get(0);
        pedido.put("itens", itensPedido(pedidoId));
        return pedido;
    }

    private List<Map<String, Object>> itensPedido(UUID pedidoId) {
        return jdbc.query("""
                SELECT p.id_produto, p.nm_produto, pp.qt_produto_pedido, pp.vl_unitario_produto_pedido
                FROM produto_pedido pp JOIN produto p ON p.id_produto = pp.id_produto WHERE pp.id_pedido = ?
                """, (rs, row) -> Map.of("produtoId", rs.getObject(1, UUID.class), "nome", rs.getString(2),
                "quantidade", rs.getInt(3), "precoUnitario", rs.getBigDecimal(4)), pedidoId);
    }

    private Map<String, Object> buscarEndereco(UUID usuarioId, UUID enderecoId) {
        List<Map<String, Object>> rows = jdbc.query("""
                SELECT id_endereco_usuario, cd_cep_endereco, nm_rua_endereco, nr_endereco,
                       tx_complemento_endereco, nm_bairro_endereco, nm_cidade_endereco, sg_estado_endereco
                FROM endereco_usuario WHERE id_usuario = ? AND id_endereco_usuario = ?
                """, this::enderecoRow, usuarioId, enderecoId);
        if (rows.isEmpty()) throw new AuthException(HttpStatus.NOT_FOUND, "Endereço não encontrado.");
        return rows.get(0);
    }

    private Map<String, Object> enderecoRow(ResultSet rs, int row) throws SQLException {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", rs.getObject("id_endereco_usuario", UUID.class)); out.put("cep", rs.getString("cd_cep_endereco").trim());
        out.put("rua", rs.getString("nm_rua_endereco")); out.put("numero", rs.getString("nr_endereco"));
        out.put("complemento", rs.getString("tx_complemento_endereco")); out.put("bairro", rs.getString("nm_bairro_endereco"));
        out.put("cidade", rs.getString("nm_cidade_endereco")); out.put("uf", rs.getString("sg_estado_endereco").trim()); return out;
    }

    private Map<String, Object> pedidoRow(ResultSet rs) throws SQLException {
        Map<String, Object> address = new LinkedHashMap<>();
        address.put("cep", rs.getString("cd_cep_endereco_pedido").trim()); address.put("rua", rs.getString("nm_rua_endereco_pedido"));
        address.put("numero", rs.getString("nr_endereco_pedido")); address.put("complemento", rs.getString("tx_complemento_endereco_pedido"));
        address.put("bairro", rs.getString("nm_bairro_endereco_pedido")); address.put("cidade", rs.getString("nm_cidade_endereco_pedido"));
        address.put("uf", rs.getString("sg_estado_endereco_pedido").trim());
        Map<String, Object> out = new LinkedHashMap<>(); out.put("id", rs.getObject("id_pedido", UUID.class));
        out.put("criadoEm", rs.getTimestamp("dt_criacao_pedido").toInstant()); out.put("entrega", rs.getString("nm_tipo_entrega_pedido"));
        out.put("total", rs.getBigDecimal("vl_total_pedido")); out.put("status", rs.getString("nm_status_pedido"));
        out.put("endereco", address); return out;
    }

    private static String cep(String value) { String d = value.replaceAll("\\D", ""); return d.substring(0, 5) + "-" + d.substring(5); }
    private static String vazioNulo(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static UUID parseUuid(String value, String message) {
        try { return UUID.fromString(value); } catch (RuntimeException ex) { throw new AuthException(HttpStatus.BAD_REQUEST, message); }
    }
}
