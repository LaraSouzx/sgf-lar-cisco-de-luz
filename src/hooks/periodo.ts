// Período de um relatório: um mês ("2026-09") ou um ano inteiro ("2026").
const FORMATO_PERIODO = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/

export function periodoValido(periodo: string) {
  return FORMATO_PERIODO.test(periodo)
}

export function periodoDoMesAtual(hoje: Date = new Date()) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

export function intervaloDoPeriodo(periodo: string) {
  if (periodo.length === 4) return { dataInicio: `${periodo}-01-01`, dataFim: `${periodo}-12-31` }

  const [ano, mes] = periodo.split('-').map(Number)
  // Dia 0 do mês seguinte é o último dia deste mês.
  const ultimoDia = String(new Date(ano, mes, 0).getDate()).padStart(2, '0')
  return { dataInicio: `${periodo}-01`, dataFim: `${periodo}-${ultimoDia}` }
}

export function rotuloDoPeriodo(periodo: string) {
  const [ano, mes] = periodo.split('-')
  return mes ? `${mes}/${ano}` : ano
}
