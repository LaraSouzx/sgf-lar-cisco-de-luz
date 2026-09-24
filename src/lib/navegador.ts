// Navegação da aba atual para fora do sistema (ex: leitor de PDF do navegador).
// Fica isolada aqui para os testes poderem substituí-la: o jsdom não implementa navegação.
export function irParaEndereco(endereco: string) {
  window.location.assign(endereco)
}
