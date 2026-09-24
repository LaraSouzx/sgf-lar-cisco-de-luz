import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import { calcularRelatorio, calcularRelatorioDoador } from './calcularRelatorio'

function lancamento(overrides: Partial<Lancamento>): Lancamento {
  return {
    id: 'id',
    data: '2026-09-10',
    valor: 100,
    tipo: 'entrada',
    categoriaId: 'doacao',
    categoriaNome: 'Doação',
    usuarioId: 'user',
    doadorId: null,
    doadorNome: null,
    descricao: 'Descrição',
    comprovanteUrl: null,
    cancelado: false,
    ...overrides,
  }
}

// Setembro/2026: entradas 500 + 100 = 600; saídas 200 + 100 + 100 = 400.
// Antes do mês: +1000 e -300 = saldo anterior 700. Saldo final = 700 + 600 - 400 = 900.
const antes = [
  lancamento({ id: 'a1', data: '2026-08-10', tipo: 'entrada', valor: 1000 }),
  lancamento({ id: 'a2', data: '2026-08-20', tipo: 'saida', valor: 300, categoriaId: 'aluguel', categoriaNome: 'Aluguel' }),
  lancamento({ id: 'ac', data: '2026-08-15', tipo: 'entrada', valor: 9999, cancelado: true }),
]
const noMes = [
  lancamento({ id: 'p1', data: '2026-09-05', tipo: 'entrada', valor: 500 }),
  lancamento({ id: 'p2', data: '2026-09-08', tipo: 'entrada', valor: 100, categoriaId: 'bazar', categoriaNome: 'Bazar' }),
  lancamento({ id: 'p3', data: '2026-09-10', tipo: 'saida', valor: 200, categoriaId: 'aluguel', categoriaNome: 'Aluguel' }),
  lancamento({ id: 'p4', data: '2026-09-15', tipo: 'saida', valor: 100, categoriaId: 'luz', categoriaNome: 'Luz' }),
  lancamento({ id: 'p5', data: '2026-09-20', tipo: 'saida', valor: 100, categoriaId: 'aluguel', categoriaNome: 'Aluguel' }),
  lancamento({ id: 'pc', data: '2026-09-12', tipo: 'entrada', valor: 5000, cancelado: true }),
]
const depois = [lancamento({ id: 'd1', data: '2026-10-01', tipo: 'entrada', valor: 999 })]

describe('calcularRelatorio', () => {
  it('calcula saldo anterior, entradas, saídas e saldo final do mês', () => {
    const relatorio = calcularRelatorio([...antes, ...noMes, ...depois], '2026-09')

    expect(relatorio).toMatchObject({
      saldoAnterior: 700,
      entradas: 600,
      saidas: 400,
      saldoFinal: 900,
    })
  })

  it('detalha entradas e saídas por categoria, da maior para a menor, com percentual', () => {
    const relatorio = calcularRelatorio([...antes, ...noMes], '2026-09')

    expect(relatorio.entradasPorCategoria).toEqual([
      { categoriaId: 'doacao', categoriaNome: 'Doação', valor: 500, percentual: 83 },
      { categoriaId: 'bazar', categoriaNome: 'Bazar', valor: 100, percentual: 17 },
    ])
    expect(relatorio.saidasPorCategoria).toEqual([
      { categoriaId: 'aluguel', categoriaNome: 'Aluguel', valor: 300, percentual: 75 },
      { categoriaId: 'luz', categoriaNome: 'Luz', valor: 100, percentual: 25 },
    ])
  })

  it('lista os lançamentos do período, sem cancelados, do mais recente para o mais antigo', () => {
    const relatorio = calcularRelatorio([...antes, ...noMes, ...depois], '2026-09')

    expect(relatorio.lancamentos.map((item) => item.id)).toEqual(['p5', 'p4', 'p3', 'p2', 'p1'])
  })

  it('cobre o ano inteiro quando o período é só o ano', () => {
    const noAnoPassado = lancamento({ id: 'x', data: '2025-12-31', tipo: 'entrada', valor: 50 })

    const relatorio = calcularRelatorio([noAnoPassado, ...antes, ...noMes, ...depois], '2026')

    expect(relatorio).toMatchObject({
      saldoAnterior: 50,
      entradas: 1000 + 500 + 100 + 999,
      saidas: 300 + 200 + 100 + 100,
    })
    expect(relatorio.saldoFinal).toBe(50 + 2599 - 700)
  })

  it('devolve tudo zerado quando não há lançamentos', () => {
    expect(calcularRelatorio([], '2026-09')).toEqual({
      saldoAnterior: 0,
      entradas: 0,
      saidas: 0,
      saldoFinal: 0,
      entradasPorCategoria: [],
      saidasPorCategoria: [],
      lancamentos: [],
    })
  })

  it('mostra saldo final negativo quando as saídas superam o que havia em caixa', () => {
    const relatorio = calcularRelatorio(
      [lancamento({ tipo: 'saida', valor: 100, data: '2026-09-02' })],
      '2026-09',
    )

    expect(relatorio.saldoFinal).toBe(-100)
  })

  it('não acumula erro de arredondamento de centavos', () => {
    const relatorio = calcularRelatorio(
      [
        lancamento({ id: 'c1', tipo: 'entrada', valor: 0.1, data: '2026-09-02' }),
        lancamento({ id: 'c2', tipo: 'entrada', valor: 0.2, data: '2026-09-03' }),
      ],
      '2026-09',
    )

    expect(relatorio.entradas).toBe(0.3)
    expect(relatorio.saldoFinal).toBe(0.3)
  })
})

describe('calcularRelatorioDoador', () => {
  it('soma só as entradas do período e lista as doações, sem cancelados', () => {
    const doacoes = [
      lancamento({ id: 'k1', data: '2026-09-05', valor: 100, doadorId: 'd1' }),
      lancamento({ id: 'k2', data: '2026-09-25', valor: 50.5, doadorId: 'd1' }),
      lancamento({ id: 'kc', data: '2026-09-06', valor: 700, doadorId: 'd1', cancelado: true }),
      lancamento({ id: 'kf', data: '2026-10-02', valor: 300, doadorId: 'd1' }),
      lancamento({ id: 'ks', data: '2026-09-07', tipo: 'saida', valor: 40, doadorId: 'd1' }),
    ]

    const relatorio = calcularRelatorioDoador(doacoes, '2026-09')

    expect(relatorio.totalDoado).toBe(150.5)
    expect(relatorio.doacoes.map((item) => item.id)).toEqual(['k2', 'k1'])
  })

  it('devolve zero e lista vazia quando o doador não doou no período', () => {
    expect(calcularRelatorioDoador([], '2026-09')).toEqual({ totalDoado: 0, doacoes: [] })
  })
})
