import type { Lancamento } from '../types/lancamento'
import {
  agruparPorCategoria,
  arredondar,
  ordenarPorDataDesc,
  somarValores,
  type ValorPorCategoria,
} from './calculosFinanceiros'
import { intervaloDoPeriodo } from './periodo'

export type Relatorio = {
  saldoAnterior: number
  entradas: number
  saidas: number
  saldoFinal: number
  entradasPorCategoria: ValorPorCategoria[]
  saidasPorCategoria: ValorPorCategoria[]
  lancamentos: Lancamento[]
}

export type RelatorioDoador = {
  totalDoado: number
  doacoes: Lancamento[]
}

const entradasDe = (lancamentos: Lancamento[]) => lancamentos.filter((item) => item.tipo === 'entrada')
const saidasDe = (lancamentos: Lancamento[]) => lancamentos.filter((item) => item.tipo === 'saida')

function saldoDe(lancamentos: Lancamento[]) {
  return arredondar(somarValores(entradasDe(lancamentos)) - somarValores(saidasDe(lancamentos)))
}

// Recebe todos os lançamentos até o fim do período: os anteriores ao início formam o saldo anterior.
// Lançamentos cancelados nunca entram nas contas, e os posteriores ao período são ignorados.
export function calcularRelatorio(lancamentos: Lancamento[], periodo: string): Relatorio {
  const { dataInicio, dataFim } = intervaloDoPeriodo(periodo)
  const ativos = lancamentos.filter((lancamento) => !lancamento.cancelado)

  const saldoAnterior = saldoDe(ativos.filter((lancamento) => lancamento.data < dataInicio))
  const doPeriodo = ativos.filter((lancamento) => lancamento.data >= dataInicio && lancamento.data <= dataFim)
  const entradas = entradasDe(doPeriodo)
  const saidas = saidasDe(doPeriodo)

  return {
    saldoAnterior,
    entradas: somarValores(entradas),
    saidas: somarValores(saidas),
    saldoFinal: arredondar(saldoAnterior + saldoDe(doPeriodo)),
    entradasPorCategoria: agruparPorCategoria(entradas),
    saidasPorCategoria: agruparPorCategoria(saidas),
    lancamentos: ordenarPorDataDesc(doPeriodo),
  }
}

// Filtrado por doador só há entradas, então o relatório é o total doado e a lista de doações (sem saldo).
export function calcularRelatorioDoador(lancamentos: Lancamento[], periodo: string): RelatorioDoador {
  const { dataInicio, dataFim } = intervaloDoPeriodo(periodo)
  const doacoes = entradasDe(lancamentos).filter(
    (lancamento) => !lancamento.cancelado && lancamento.data >= dataInicio && lancamento.data <= dataFim,
  )

  return { totalDoado: somarValores(doacoes), doacoes: ordenarPorDataDesc(doacoes) }
}
