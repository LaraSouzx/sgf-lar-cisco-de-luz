// Separa a string em vez de usar Date, que deslocaria o dia por causa do fuso horário.
export function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarValorEmReais(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Vírgula decimal e sem separador de milhar: é como o Excel em português lê um número.
export function formatarValorParaPlanilha(valor: number) {
  return valor.toFixed(2).replace('.', ',')
}
