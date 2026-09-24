import type { Lancamento } from '../types/lancamento'
import { agruparPorCategoria, ordenarPorDataDesc, type ValorPorCategoria } from './calculosFinanceiros'

export type GastoPorCategoria = ValorPorCategoria

export type ResumoDashboard = {
  saldo: number
  entradasMes: number
  saidasMes: number
  entradasMesAnterior: number
  saidasMesAnterior: number
  doacoesMes: number
  doadoresMes: number
  gastosPorCategoria: GastoPorCategoria[]
  doacoesRecentes: Lancamento[]
  ultimosLancamentos: Lancamento[]
  pendenciasComprovante: number
}

const LIMITE_LISTAS_RECENTES = 3

function mesmoMes(data: string, referencia: Date) {
  const [ano, mes] = data.split('-').map(Number)
  return ano === referencia.getFullYear() && mes === referencia.getMonth() + 1
}

function mesAnterior(referencia: Date) {
  return new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1)
}

export function calcularResumoDashboard(
  lancamentos: Lancamento[],
  hoje: Date = new Date(),
): ResumoDashboard {
  const ativos = lancamentos.filter((lancamento) => !lancamento.cancelado)
  const mesAnteriorRef = mesAnterior(hoje)

  const saldo = ativos.reduce(
    (total, l) => total + (l.tipo === 'entrada' ? l.valor : -l.valor),
    0,
  )

  const doMes = ativos.filter((l) => mesmoMes(l.data, hoje))
  const doMesAnterior = ativos.filter((l) => mesmoMes(l.data, mesAnteriorRef))

  const entradasMes = doMes
    .filter((l) => l.tipo === 'entrada')
    .reduce((total, l) => total + l.valor, 0)
  const saidasMes = doMes.filter((l) => l.tipo === 'saida').reduce((total, l) => total + l.valor, 0)
  const entradasMesAnterior = doMesAnterior
    .filter((l) => l.tipo === 'entrada')
    .reduce((total, l) => total + l.valor, 0)
  const saidasMesAnterior = doMesAnterior
    .filter((l) => l.tipo === 'saida')
    .reduce((total, l) => total + l.valor, 0)

  const doacoesDoMes = doMes.filter((l) => l.tipo === 'entrada' && l.doadorId)
  const doacoesMes = doacoesDoMes.reduce((total, l) => total + l.valor, 0)
  const doadoresMes = new Set(doacoesDoMes.map((l) => l.doadorId)).size

  const gastosPorCategoria = agruparPorCategoria(doMes.filter((item) => item.tipo === 'saida'))

  const doacoesRecentes = ordenarPorDataDesc(ativos.filter((l) => l.tipo === 'entrada' && l.doadorId)).slice(
    0,
    LIMITE_LISTAS_RECENTES,
  )
  const ultimosLancamentos = ordenarPorDataDesc(ativos).slice(0, LIMITE_LISTAS_RECENTES)

  const pendenciasComprovante = ativos.filter((l) => !l.comprovanteUrl).length

  return {
    saldo,
    entradasMes,
    saidasMes,
    entradasMesAnterior,
    saidasMesAnterior,
    doacoesMes,
    doadoresMes,
    gastosPorCategoria,
    doacoesRecentes,
    ultimosLancamentos,
    pendenciasComprovante,
  }
}
