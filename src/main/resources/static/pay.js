// Não há API de pagamento Pix nesta versão. Impede que um pedido seja criado/simulado pelo navegador.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pay-loading').hidden = true;
  document.getElementById('pay-error').hidden = true;
  document.getElementById('pay-content').hidden = true;
  document.getElementById('pay-empty').hidden = false;
});
