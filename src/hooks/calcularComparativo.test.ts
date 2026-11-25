import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import type { Relatorio } from './calcularRelatorio'
import { calcularComparativoMensal } from './calcularComparativo'

// "Hoje" fixo: outubro de 2026 (o mês 10 é o mês em andamento).
const HOJE = new Date(2026, 9, 15)

function lancamento(overrides: Partial<Lancamento>): Lancamento {
  return {
    id: 'id',
    data: '2026-01-10',
    valor: 100,
    tipo: 'entrada',
    categoriaId: 'doacao',
    categoriaNome: 'Doação',
    usuarioId: 'user',
    doadorId: null,
    doadorNome: null,
    formaRecebimento: null,
    descricao: 'Descrição',
    comprovanteUrl: null,
    cancelado: false,
    ...overrides,
  }
}

function relatorio(lancamentos: Lancamento[], saldoAnterior = 0): Relatorio {
  return {
    saldoAnterior,
    entradas: 0,
    saidas: 0,
    saldoFinal: 0,
    entradasPorCategoria: [],
    saidasPorCategoria: [],
    lancamentos,
  }
}

describe('calcularComparativoMensal: meses exibidos', () => {
  it('mostra os 12 meses de um ano passado, sem marcar nenhum em andamento', () => {
    const { meses } = calcularComparativoMensal(relatorio([]), '2025', HOJE)

    expect(meses).toHaveLength(12)
    expect(meses.some((mes) => mes.emAndamento)).toBe(false)
  })

  it('mostra só até o mês atual no ano corrente, marcando o atual como em andamento', () => {
    const { meses } = calcularComparativoMensal(relatorio([]), '2026', HOJE)

    expect(meses).toHaveLength(10)
    expect(meses.filter((mes) => mes.emAndamento).map((mes) => mes.mes)).toEqual([10])
  })

  it('não mostra mês nenhum num ano futuro', () => {
    expect(calcularComparativoMensal(relatorio([]), '2027', HOJE).meses).toEqual([])
  })
})

describe('calcularComparativoMensal: totais por mês', () => {
  const lancamentos = [
    lancamento({ data: '2026-01-10', tipo: 'entrada', valor: 1000 }),
    lancamento({ data: '2026-01-20', tipo: 'saida', valor: 400 }),
    lancamento({ data: '2026-02-05', tipo: 'entrada', valor: 1500 }),
    lancamento({ data: '2026-02-06', tipo: 'saida', valor: 200 }),
  ]

  it('soma entradas, saídas e resultado de cada mês', () => {
    const [janeiro, fevereiro] = calcularComparativoMensal(relatorio(lancamentos), '2026', HOJE).meses

    expect(janeiro).toMatchObject({ mes: 1, entradas: 1000, saidas: 400, resultado: 600 })
    expect(fevereiro).toMatchObject({ mes: 2, entradas: 1500, saidas: 200, resultado: 1300 })
  })

  it('o saldo final acumula a partir do saldo anterior ao ano, inclusive em meses sem movimento', () => {
    const meses = calcularComparativoMensal(relatorio(lancamentos, 500), '2026', HOJE).meses

    expect(meses.slice(0, 3).map((mes) => mes.saldoFinal)).toEqual([1100, 2400, 2400])
  })

  it('calcula a variação contra o mês anterior', () => {
    const [, fevereiro, marco] = calcularComparativoMensal(relatorio(lancamentos), '2026', HOJE).meses

    expect(fevereiro.variacaoEntradas).toBeCloseTo(50)
    expect(fevereiro.variacaoSaidas).toBeCloseTo(-50)
    // Março zerou: caiu 100% em relação a fevereiro.
    expect(marco.variacaoEntradas).toBeCloseTo(-100)
  })

  it('não calcula variação em janeiro nem quando o mês anterior foi zero', () => {
    const [janeiro, , , abril] = calcularComparativoMensal(relatorio(lancamentos), '2026', HOJE).meses

    expect(janeiro.variacaoEntradas).toBeNull()
    expect(janeiro.variacaoSaidas).toBeNull()
    // Março foi zero, então abril não tem base de comparação (evita "infinito %").
    expect(abril.variacaoEntradas).toBeNull()
  })
})

describe('calcularComparativoMensal: categorias', () => {
  const lancamentos = [
    lancamento({ data: '2026-01-10', categoriaId: 'doacao', categoriaNome: 'Doação', valor: 100 }),
    lancamento({ data: '2026-03-10', categoriaId: 'doacao', categoriaNome: 'Doação', valor: 300 }),
    lancamento({ data: '2026-02-10', categoriaId: 'evento', categoriaNome: 'Evento', valor: 900 }),
    lancamento({ data: '2026-01-15', tipo: 'saida', categoriaId: 'luz', categoriaNome: 'Luz', valor: 80 }),
  ]

  it('agrupa por categoria com um valor por mês exibido e o total do ano', () => {
    const { entradasPorCategoria } = calcularComparativoMensal(relatorio(lancamentos), '2026', HOJE)
    const doacao = entradasPorCategoria.find((categoria) => categoria.categoriaId === 'doacao')

    expect(doacao?.total).toBe(400)
    expect(doacao?.valoresPorMes.slice(0, 4)).toEqual([100, 0, 300, 0])
    expect(doacao?.valoresPorMes).toHaveLength(10)
  })

  it('ordena pelo maior total do ano e separa entradas de saídas', () => {
    const { entradasPorCategoria, saidasPorCategoria } = calcularComparativoMensal(relatorio(lancamentos), '2026', HOJE)

    expect(entradasPorCategoria.map((categoria) => categoria.categoriaNome)).toEqual(['Evento', 'Doação'])
    expect(saidasPorCategoria.map((categoria) => categoria.categoriaNome)).toEqual(['Luz'])
  })

  it('só traz categorias com movimento no ano', () => {
    const comparativo = calcularComparativoMensal(relatorio([]), '2026', HOJE)

    expect(comparativo.entradasPorCategoria).toEqual([])
    expect(comparativo.saidasPorCategoria).toEqual([])
  })
})
