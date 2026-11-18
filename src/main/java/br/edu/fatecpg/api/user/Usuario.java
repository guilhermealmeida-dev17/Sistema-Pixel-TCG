package br.edu.fatecpg.api.user;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @Column(name = "id_usuario", nullable = false, updatable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "cd_cpf_usuario", columnDefinition = "char(11)", length = 11, unique = true)
    private String cpf;

    @Column(name = "nm_usuario", nullable = false, length = 300)
    private String nome;

    @Column(name = "nm_email_usuario", nullable = false, unique = true, length = 300)
    private String email;

    @Column(name = "cd_telefone_usuario", length = 20)
    private String telefone;

    @Column(name = "nm_cidade_usuario", length = 100)
    private String cidade;

    @Column(name = "cd_senha_usuario", nullable = false, length = 300)
    private String senhaHash;

    @Column(name = "ic_admin_usuario", nullable = false)
    private boolean admin;

    @Column(name = "tx_url_imagem_usuario", columnDefinition = "text")
    private String urlImagem;

    @Column(name = "dt_criacao_usuario", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "dt_atualizacao_usuario", nullable = false)
    private LocalDateTime atualizadoEm;

    @Column(name = "ic_aceite_termos_usuario", nullable = false)
    private boolean aceitouTermos;

    @Column(name = "dt_aceite_termos_usuario")
    private LocalDateTime dataAceiteTermos;

    @Column(name = "cd_versao_termos_usuario", length = 40)
    private String versaoTermos;

    protected Usuario() { }

    public Usuario(String nome, String email, String senhaHash, String cpf, String versaoTermos) {
        this.id = UUID.randomUUID();
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.cpf = cpf;
        this.admin = false;
        this.aceitouTermos = true;
        this.versaoTermos = versaoTermos;
    }

    @PrePersist
    void antesDeInserir() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) criadoEm = agora;
        atualizadoEm = agora;
        if (aceitouTermos && dataAceiteTermos == null) dataAceiteTermos = agora;
    }

    @PreUpdate
    void antesDeAtualizar() {
        atualizadoEm = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getCpf() { return cpf == null ? null : cpf.trim(); }
    public String getTelefone() { return telefone; }
    public String getCidade() { return cidade; }
    public String getSenhaHash() { return senhaHash; }
    public boolean isAdmin() { return admin; }
    public String getUrlImagem() { return urlImagem; }
    public LocalDateTime getCriadoEm() { return criadoEm; }

    public void atualizarPerfil(String nome, String email, String cpf, String telefone, String cidade, String urlImagem) {
        this.nome = nome;
        this.email = email;
        this.cpf = cpf;
        this.telefone = telefone;
        this.cidade = cidade;
        this.urlImagem = urlImagem;
    }

    public void alterarSenha(String senhaHash) { this.senhaHash = senhaHash; }
}
