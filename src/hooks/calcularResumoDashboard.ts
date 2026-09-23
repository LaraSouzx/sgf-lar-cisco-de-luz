import type { Lancamento } from '../types/lancamento'

export type GastoPorCategoria = {
  categoriaId: string
  categoriaNome: string
  valor: number
  percentual: number
}

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

function ordenarPorDataDesc(lancamentos: Lancamento[]) {
  return [...lancamentos].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
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

  const saidasPorCategoria = new Map<string, GastoPorCategoria>()
  for (const l of doMes.filter((item) => item.tipo === 'saida')) {
    const atual = saidasPorCategoria.get(l.categoriaId)
    if (atual) {
      atual.valor += l.valor
    } else {
      saidasPorCategoria.set(l.categoriaId, {
        categoriaId: l.categoriaId,
        categoriaNome: l.categoriaNome,
        valor: l.valor,
        percentual: 0,
      })
    }
  }
  const gastosPorCategoria = Array.from(saidasPorCategoria.values())
    .sort((a, b) => b.valor - a.valor)
    .map((gasto) => ({
      ...gasto,
      percentual: saidasMes > 0 ? Math.round((gasto.valor / saidasMes) * 100) : 0,
    }))

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
