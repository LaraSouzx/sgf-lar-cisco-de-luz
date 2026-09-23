import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import { calcularResumoDashboard } from './calcularResumoDashboard'

function lancamento(overrides: Partial<Lancamento>): Lancamento {
  return {
    id: 'id',
    data: '2026-09-10',
    valor: 100,
    tipo: 'entrada',
    categoriaId: 'cat',
    categoriaNome: 'Categoria',
    usuarioId: 'user',
    doadorId: null,
    doadorNome: null,
    descricao: 'Descrição',
    comprovanteUrl: 'http://exemplo.com/comprovante.pdf',
    cancelado: false,
    ...overrides,
  }
}

describe('calcularResumoDashboard', () => {
  const hoje = new Date('2026-09-22T12:00:00')

  it('calcula o saldo somando entradas e subtraindo saídas de todos os lançamentos', () => {
    const lancamentos = [
      lancamento({ tipo: 'entrada', valor: 1000, data: '2026-08-01' }),
      lancamento({ tipo: 'saida', valor: 300, data: '2026-09-01' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.saldo).toBe(700)
  })

  it('ignora lançamentos cancelados no saldo e nos totais', () => {
    const lancamentos = [
      lancamento({ tipo: 'entrada', valor: 1000, cancelado: true, data: '2026-09-05' }),
      lancamento({ tipo: 'entrada', valor: 200, data: '2026-09-05' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.saldo).toBe(200)
    expect(resumo.entradasMes).toBe(200)
  })

  it('separa entradas e saídas do mês atual das do mês anterior', () => {
    const lancamentos = [
      lancamento({ tipo: 'entrada', valor: 500, data: '2026-09-10' }),
      lancamento({ tipo: 'saida', valor: 100, data: '2026-09-11' }),
      lancamento({ tipo: 'entrada', valor: 400, data: '2026-08-10' }),
      lancamento({ tipo: 'saida', valor: 50, data: '2026-08-11' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.entradasMes).toBe(500)
    expect(resumo.saidasMes).toBe(100)
    expect(resumo.entradasMesAnterior).toBe(400)
    expect(resumo.saidasMesAnterior).toBe(50)
  })

  it('soma apenas as entradas com doador identificado como doações do mês', () => {
    const lancamentos = [
      lancamento({ tipo: 'entrada', valor: 150, doadorId: 'd1', data: '2026-09-05' }),
      lancamento({ tipo: 'entrada', valor: 300, doadorId: 'd2', data: '2026-09-06' }),
      lancamento({ tipo: 'entrada', valor: 999, doadorId: null, data: '2026-09-07' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.doacoesMes).toBe(450)
    expect(resumo.doadoresMes).toBe(2)
  })

  it('conta cada doador uma única vez mesmo com mais de uma doação no mês', () => {
    const lancamentos = [
      lancamento({ tipo: 'entrada', valor: 100, doadorId: 'd1', data: '2026-09-05' }),
      lancamento({ tipo: 'entrada', valor: 50, doadorId: 'd1', data: '2026-09-06' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.doadoresMes).toBe(1)
  })

  it('agrupa saídas do mês por categoria com valor e percentual', () => {
    const lancamentos = [
      lancamento({ tipo: 'saida', valor: 300, categoriaId: 'c1', categoriaNome: 'Alimentação', data: '2026-09-05' }),
      lancamento({ tipo: 'saida', valor: 100, categoriaId: 'c2', categoriaNome: 'Transporte', data: '2026-09-06' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.gastosPorCategoria).toEqual([
      { categoriaId: 'c1', categoriaNome: 'Alimentação', valor: 300, percentual: 75 },
      { categoriaId: 'c2', categoriaNome: 'Transporte', valor: 100, percentual: 25 },
    ])
  })

  it('retorna lista vazia de gastos por categoria quando não há saídas no mês', () => {
    const resumo = calcularResumoDashboard([], hoje)

    expect(resumo.gastosPorCategoria).toEqual([])
  })

  it('lista os lançamentos mais recentes com doador como doações recentes', () => {
    const lancamentos = [
      lancamento({ id: 'l1', tipo: 'entrada', doadorId: 'd1', data: '2026-09-01' }),
      lancamento({ id: 'l2', tipo: 'entrada', doadorId: null, data: '2026-09-02' }),
      lancamento({ id: 'l3', tipo: 'entrada', doadorId: 'd2', data: '2026-09-03' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.doacoesRecentes.map((l) => l.id)).toEqual(['l3', 'l1'])
  })

  it('lista os últimos lançamentos em geral, mais recentes primeiro, limitado a 3', () => {
    const lancamentos = [
      lancamento({ id: 'l1', data: '2026-09-01' }),
      lancamento({ id: 'l2', data: '2026-09-04' }),
      lancamento({ id: 'l3', data: '2026-09-02' }),
      lancamento({ id: 'l4', data: '2026-09-03' }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.ultimosLancamentos.map((l) => l.id)).toEqual(['l2', 'l4', 'l3'])
  })

  it('conta lançamentos não cancelados sem comprovante como pendências', () => {
    const lancamentos = [
      lancamento({ comprovanteUrl: null, cancelado: false }),
      lancamento({ comprovanteUrl: null, cancelado: true }),
      lancamento({ comprovanteUrl: 'http://exemplo.com/x.pdf', cancelado: false }),
    ]

    const resumo = calcularResumoDashboard(lancamentos, hoje)

    expect(resumo.pendenciasComprovante).toBe(1)
  })
})
