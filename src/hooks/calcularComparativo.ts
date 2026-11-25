import type { Lancamento, TipoLancamento } from '../types/lancamento'
import type { Relatorio } from './calcularRelatorio'
import { agruparPorCategoria, arredondar, somarValores } from './calculosFinanceiros'

export type MesComparativo = {
  mes: number
  entradas: number
  saidas: number
  resultado: number
  saldoFinal: number
  // Percentual contra o mês anterior; null quando não há base de comparação (janeiro ou mês anterior zerado).
  variacaoEntradas: number | null
  variacaoSaidas: number | null
  emAndamento: boolean
}

export type CategoriaComparativo = {
  categoriaId: string
  categoriaNome: string
  total: number
  // Um valor por mês exibido (0 quando a categoria não teve movimento naquele mês).
  valoresPorMes: number[]
}

export type Comparativo = {
  ano: string
  meses: MesComparativo[]
  entradasPorCategoria: CategoriaComparativo[]
  saidasPorCategoria: CategoriaComparativo[]
}

function variacaoPercentual(atual: number, anterior: number | undefined) {
  if (!anterior) return null
  return ((atual - anterior) / anterior) * 100
}

// Só os meses que já começaram: o ano corrente vai até o mês atual, anos passados têm os 12.
function quantidadeDeMeses(ano: number, hoje: Date) {
  if (ano < hoje.getFullYear()) return 12
  return ano === hoje.getFullYear() ? hoje.getMonth() + 1 : 0
}

function categoriasPorMes(lancamentosPorMes: Lancamento[][], tipo: TipoLancamento): CategoriaComparativo[] {
  const categorias = new Map<string, CategoriaComparativo>()

  lancamentosPorMes.forEach((lancamentos, indiceDoMes) => {
    const doTipo = lancamentos.filter((lancamento) => lancamento.tipo === tipo)
    for (const { categoriaId, categoriaNome, valor } of agruparPorCategoria(doTipo)) {
      const categoria = categorias.get(categoriaId) ?? {
        categoriaId,
        categoriaNome,
        total: 0,
        valoresPorMes: lancamentosPorMes.map(() => 0),
      }
      categoria.valoresPorMes[indiceDoMes] = valor
      categoria.total = arredondar(categoria.total + valor)
      categorias.set(categoriaId, categoria)
    }
  })

  return [...categorias.values()].sort((a, b) => b.total - a.total)
}

// Recebe o relatório do ano inteiro (saldo anterior + lançamentos do ano, já sem cancelados)
// e o reparte mês a mês: não precisa de nenhuma consulta nova ao banco.
export function calcularComparativoMensal(relatorio: Relatorio, ano: string, hoje: Date = new Date()): Comparativo {
  const quantidade = quantidadeDeMeses(Number(ano), hoje)
  const lancamentosPorMes = Array.from({ length: quantidade }, (_, indice) =>
    relatorio.lancamentos.filter((lancamento) => Number(lancamento.data.slice(5, 7)) === indice + 1),
  )

  let saldo = relatorio.saldoAnterior
  const meses = lancamentosPorMes.map((lancamentos, indice): MesComparativo => {
    const entradas = somarValores(lancamentos.filter((lancamento) => lancamento.tipo === 'entrada'))
    const saidas = somarValores(lancamentos.filter((lancamento) => lancamento.tipo === 'saida'))
    const resultado = arredondar(entradas - saidas)
    saldo = arredondar(saldo + resultado)
    return {
      mes: indice + 1,
      entradas,
      saidas,
      resultado,
      saldoFinal: saldo,
      variacaoEntradas: null,
      variacaoSaidas: null,
      emAndamento: Number(ano) === hoje.getFullYear() && indice === hoje.getMonth(),
    }
  })

  // A variação precisa do mês anterior já calculado, por isso é um segundo passo.
  meses.forEach((mes, indice) => {
    mes.variacaoEntradas = variacaoPercentual(mes.entradas, meses[indice - 1]?.entradas)
    mes.variacaoSaidas = variacaoPercentual(mes.saidas, meses[indice - 1]?.saidas)
  })

  return {
    ano,
    meses,
    entradasPorCategoria: categoriasPorMes(lancamentosPorMes, 'entrada'),
    saidasPorCategoria: categoriasPorMes(lancamentosPorMes, 'saida'),
  }
}
