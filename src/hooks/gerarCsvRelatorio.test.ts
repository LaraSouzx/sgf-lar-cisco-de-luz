import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import type { Relatorio, RelatorioDoador } from './calcularRelatorio'
import { gerarCsvDoacoes, gerarCsvRelatorio } from './gerarCsvRelatorio'

const BOM = '﻿'
const contexto = { geradoEm: '2026-09-23', usuario: 'maria@exemplo.com' }

function lancamento(overrides: Partial<Lancamento>): Lancamento {
  return {
    id: 'id',
    data: '2026-09-05',
    valor: 500,
    tipo: 'entrada',
    categoriaId: 'doacao',
    categoriaNome: 'Doação',
    usuarioId: 'user',
    doadorId: 'd1',
    doadorNome: 'Maria',
    descricao: 'Doação mensal',
    comprovanteUrl: null,
    cancelado: false,
    ...overrides,
  }
}

function relatorio(overrides: Partial<Relatorio> = {}): Relatorio {
  return {
    saldoAnterior: 700,
    entradas: 600,
    saidas: 400,
    saldoFinal: 900,
    entradasPorCategoria: [{ categoriaId: 'doacao', categoriaNome: 'Doação', valor: 500, percentual: 83 }],
    saidasPorCategoria: [{ categoriaId: 'aluguel', categoriaNome: 'Aluguel', valor: 400, percentual: 100 }],
    lancamentos: [lancamento({})],
    ...overrides,
  }
}

const linhas = (csv: string) => csv.replace(BOM, '').split('\r\n')

describe('gerarCsvRelatorio', () => {
  it('começa com BOM para o Excel abrir os acentos corretamente', () => {
    expect(gerarCsvRelatorio(relatorio(), '2026-09', contexto).startsWith(BOM)).toBe(true)
  })

  it('monta cabeçalho, totais, categorias e lançamentos separados por ponto e vírgula', () => {
    const csv = gerarCsvRelatorio(relatorio(), '2026-09', contexto)

    expect(linhas(csv)).toEqual([
      'Relatório financeiro',
      'Período;09/2026',
      'Gerado em;23/09/2026',
      'Gerado por;maria@exemplo.com',
      '',
      'Saldo anterior;700,00',
      'Entradas;600,00',
      'Saídas;400,00',
      'Saldo final;900,00',
      '',
      'Entradas por categoria',
      'Categoria;Valor;Percentual',
      'Doação;500,00;83%',
      '',
      'Saídas por categoria',
      'Categoria;Valor;Percentual',
      'Aluguel;400,00;100%',
      '',
      'Lançamentos',
      'Data;Tipo;Categoria;Doador;Descrição;Valor',
      '05/09/2026;Entrada;Doação;Maria;Doação mensal;500,00',
    ])
  })

  it('mostra o saldo final negativo com sinal e deixa o doador vazio quando não há', () => {
    const csv = gerarCsvRelatorio(
      relatorio({
        saldoFinal: -100,
        lancamentos: [
          lancamento({ tipo: 'saida', valor: 100, doadorId: null, doadorNome: null, categoriaNome: 'Luz' }),
        ],
      }),
      '2026',
      contexto,
    )

    expect(linhas(csv)).toContain('Saldo final;-100,00')
    expect(linhas(csv)).toContain('05/09/2026;Saída;Luz;;Doação mensal;100,00')
    expect(linhas(csv)).toContain('Período;2026')
  })

  it('protege campos com ponto e vírgula e aspas', () => {
    const csv = gerarCsvRelatorio(
      relatorio({ lancamentos: [lancamento({ descricao: 'Compra; "arroz"' })] }),
      '2026-09',
      contexto,
    )

    expect(linhas(csv)).toContain('05/09/2026;Entrada;Doação;Maria;"Compra; ""arroz""";500,00')
  })

  // Uma descrição como "=SOMA(A1)" viraria fórmula ao abrir no Excel.
  it.each(['=SOMA(A1)', '+1', '-1', '@usuario'])('neutraliza texto que o Excel leria como fórmula ("%s")', (descricao) => {
    const csv = gerarCsvRelatorio(relatorio({ lancamentos: [lancamento({ descricao })] }), '2026-09', contexto)

    expect(linhas(csv)).toContain(`05/09/2026;Entrada;Doação;Maria;'${descricao};500,00`)
  })
})

describe('gerarCsvDoacoes', () => {
  it('monta o relatório de doações de um doador, sem saldo', () => {
    const doacoes: RelatorioDoador = {
      totalDoado: 150.5,
      doacoes: [lancamento({ data: '2026-09-25', valor: 50.5 }), lancamento({ data: '2026-09-05', valor: 100 })],
    }

    const csv = gerarCsvDoacoes(doacoes, '2026-09', 'Maria Silva', contexto)

    expect(linhas(csv)).toEqual([
      'Relatório de doações',
      'Período;09/2026',
      'Doador;Maria Silva',
      'Gerado em;23/09/2026',
      'Gerado por;maria@exemplo.com',
      '',
      'Total doado;150,50',
      '',
      'Doações',
      'Data;Categoria;Descrição;Valor',
      '25/09/2026;Doação;Doação mensal;50,50',
      '05/09/2026;Doação;Doação mensal;100,00',
    ])
  })
})
