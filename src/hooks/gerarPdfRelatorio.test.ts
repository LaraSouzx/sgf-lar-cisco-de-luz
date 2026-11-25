import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import type { Relatorio, RelatorioDoador } from './calcularRelatorio'
import type { Comparativo } from './calcularComparativo'
import { gerarPdfComparativo, gerarPdfDoacoes, gerarPdfRelatorio } from './gerarPdfRelatorio'

const contexto = { geradoEm: '2026-09-23', usuario: 'maria@exemplo.com' }

function lancamento(overrides: Partial<Lancamento>): Lancamento {
  return {
    id: 'id',
    data: '2026-09-05',
    valor: 500,
    tipo: 'entrada',
    categoriaId: 'doacao',
    categoriaNome: 'Doacao',
    usuarioId: 'user',
    doadorId: 'd1',
    doadorNome: 'Maria',
    formaRecebimento: null,
    descricao: 'Mensalidade',
    comprovanteUrl: null,
    cancelado: false,
    ...overrides,
  }
}

const relatorio: Relatorio = {
  saldoAnterior: 700,
  entradas: 600,
  saidas: 400,
  saldoFinal: 900,
  entradasPorCategoria: [{ categoriaId: 'doacao', categoriaNome: 'Doacao', valor: 500, percentual: 83 }],
  saidasPorCategoria: [{ categoriaId: 'aluguel', categoriaNome: 'Aluguel', valor: 400, percentual: 100 }],
  lancamentos: [lancamento({})],
}

// Os textos de um PDF gerado sem compressão ficam legíveis no próprio arquivo, o que basta
// para conferir "o que o usuário vai ver" sem depender de um leitor de PDF.
function textoDoPdf(conteudo: ArrayBuffer) {
  return new TextDecoder('latin1').decode(conteudo)
}

describe('gerarPdfRelatorio', () => {
  it('gera um arquivo PDF', async () => {
    const pdf = await gerarPdfRelatorio(relatorio, '2026-09', contexto)

    expect(textoDoPdf(pdf).startsWith('%PDF-')).toBe(true)
  })

  it('inclui período, totais, categorias e lançamentos', async () => {
    const texto = textoDoPdf(await gerarPdfRelatorio(relatorio, '2026-09', contexto))

    for (const esperado of ['09/2026', 'Saldo anterior', 'Saldo final', 'Aluguel', 'Mensalidade', 'Maria', 'maria@exemplo.com']) {
      expect(texto).toContain(esperado)
    }
  })

  it('mostra uma linha de aviso quando não há lançamentos nas categorias', async () => {
    const vazio: Relatorio = { ...relatorio, entradasPorCategoria: [], saidasPorCategoria: [], lancamentos: [] }

    const texto = textoDoPdf(await gerarPdfRelatorio(vazio, '2026', contexto))

    // O "." cobre as letras acentuadas, que o PDF grava como um byte só.
    expect(texto).toMatch(/Nenhum lan.amento neste per.odo/)
  })
})

describe('gerarPdfDoacoes', () => {
  it('gera o PDF de doações de um doador com o total doado', async () => {
    const doacoes: RelatorioDoador = {
      totalDoado: 150.5,
      doacoes: [lancamento({ valor: 150.5, descricao: 'Mensalidade' })],
    }

    const pdf = await gerarPdfDoacoes(doacoes, '2026-09', 'Maria Silva', contexto)
    const texto = textoDoPdf(pdf)

    expect(texto.startsWith('%PDF-')).toBe(true)
    for (const esperado of ['Total doado', 'Maria Silva', 'Mensalidade']) {
      expect(texto).toContain(esperado)
    }
  })
})

describe('gerarPdfComparativo', () => {
  const comparativo: Comparativo = {
    ano: '2026',
    meses: [
      { mes: 1, entradas: 1000, saidas: 400, resultado: 600, saldoFinal: 600, variacaoEntradas: null, variacaoSaidas: null, emAndamento: false },
    ],
    entradasPorCategoria: [{ categoriaId: 'c1', categoriaNome: 'Doacao mensal', total: 1000, valoresPorMes: [1000] }],
    saidasPorCategoria: [{ categoriaId: 'c2', categoriaNome: 'Conta de luz', total: 400, valoresPorMes: [400] }],
  }

  it('gera o PDF em paisagem com os totais e as categorias', async () => {
    const pdf = await gerarPdfComparativo(comparativo, contexto)
    const texto = textoDoPdf(pdf)

    expect(texto.startsWith('%PDF-')).toBe(true)
    // Paisagem: a página é mais larga (842) do que alta (595).
    expect(texto).toMatch(/MediaBox \[0 0 841\.\d+ 595\.\d+\]/)
    for (const esperado of ['Comparativo mensal', 'Janeiro', 'Doacao mensal', 'Conta de luz', 'Jan', 'Total']) {
      expect(texto).toContain(esperado)
    }
  })
})
