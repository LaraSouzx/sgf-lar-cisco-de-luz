import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import type { Relatorio, RelatorioDoador } from './calcularRelatorio'
import { gerarPdfDoacoes, gerarPdfRelatorio } from './gerarPdfRelatorio'

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
