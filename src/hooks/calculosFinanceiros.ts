import type { Lancamento } from '../types/lancamento'

export type ValorPorCategoria = {
  categoriaId: string
  categoriaNome: string
  valor: number
  percentual: number
}

// Trabalha em centavos inteiros: em ponto flutuante, 0,1 + 0,2 daria 0,30000000000000004.
export function arredondar(valor: number) {
  return Math.round(valor * 100) / 100
}

export function somarValores(lancamentos: Lancamento[]) {
  return lancamentos.reduce((total, lancamento) => arredondar(total + lancamento.valor), 0)
}

export function ordenarPorDataDesc(lancamentos: Lancamento[]) {
  return [...lancamentos].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
}

// Soma por categoria, da maior para a menor, com o percentual de cada uma sobre o total dos lançamentos.
export function agruparPorCategoria(lancamentos: Lancamento[]): ValorPorCategoria[] {
  const total = somarValores(lancamentos)
  const porCategoria = new Map<string, Lancamento[]>()
  for (const lancamento of lancamentos) {
    porCategoria.set(lancamento.categoriaId, [...(porCategoria.get(lancamento.categoriaId) ?? []), lancamento])
  }

  return Array.from(porCategoria.values())
    .map((grupo) => {
      const valor = somarValores(grupo)
      return {
        categoriaId: grupo[0].categoriaId,
        categoriaNome: grupo[0].categoriaNome,
        valor,
        percentual: total > 0 ? Math.round((valor / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.valor - a.valor)
}
