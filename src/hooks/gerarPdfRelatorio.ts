import type { jsPDF } from 'jspdf'
import type { ContextoExportacao } from '../types/exportacao'
import type { Relatorio, RelatorioDoador } from './calcularRelatorio'
import type { ValorPorCategoria } from './calculosFinanceiros'
import { formatarData, formatarValorEmReais } from './formatacao'
import { rotuloDoPeriodo } from './periodo'

const MARGEM = 14
const ESPACO_ENTRE_SECOES = 10
const COR_CABECALHO_TABELA: [number, number, number] = [20, 26, 20]
const SEM_LANCAMENTOS = 'Nenhum lançamento neste período'

// A biblioteca de PDF é pesada; só é baixada quando alguém realmente exporta.
async function carregarBiblioteca() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  return { jsPDF, autoTable }
}

type Biblioteca = Awaited<ReturnType<typeof carregarBiblioteca>>

// O espaço não separável que o Intl coloca depois de "R$" vira espaço comum, que toda fonte de PDF tem.
const reais = (valor: number) => formatarValorEmReais(valor).replace(/\s/g, ' ')

// Monta o PDF de cima para baixo: título e cabeçalho, depois uma tabela por seção.
function criarDocumento({ jsPDF, autoTable }: Biblioteca, titulo: string, linhasDoCabecalho: string[]) {
  const doc = new jsPDF()
  let y = 20

  doc.setFontSize(16)
  doc.text(titulo, MARGEM, y)
  doc.setFontSize(10)
  for (const linha of linhasDoCabecalho) {
    y += 6
    doc.text(linha, MARGEM, y)
  }
  y += ESPACO_ENTRE_SECOES

  return {
    tabela(tituloDaSecao: string, cabecalho: string[], linhas: string[][], colunasAlinhadasADireita: number[] = []) {
      doc.setFontSize(12)
      doc.text(tituloDaSecao, MARGEM, y)
      autoTable(doc, {
        startY: y + 3,
        head: [cabecalho],
        body: linhas,
        margin: { left: MARGEM, right: MARGEM },
        styles: { fontSize: 9 },
        headStyles: { fillColor: COR_CABECALHO_TABELA },
        columnStyles: Object.fromEntries(colunasAlinhadasADireita.map((coluna) => [coluna, { halign: 'right' }])),
      })
      // A tabela pode ter atravessado páginas: a próxima seção começa logo depois dela.
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + ESPACO_ENTRE_SECOES
    },
    arquivo: () => doc.output('arraybuffer'),
  }
}

function linhasDeCategorias(categorias: ValorPorCategoria[]) {
  if (categorias.length === 0) return [[SEM_LANCAMENTOS, '', '']]
  return categorias.map((item) => [item.categoriaNome, reais(item.valor), `${item.percentual}%`])
}

function cabecalhoGeracao(periodo: string, { geradoEm, usuario }: ContextoExportacao, extras: string[] = []) {
  return [`Período: ${rotuloDoPeriodo(periodo)}`, ...extras, `Gerado em ${formatarData(geradoEm)} por ${usuario}`]
}

export async function gerarPdfRelatorio(relatorio: Relatorio, periodo: string, contexto: ContextoExportacao) {
  const documento = criarDocumento(await carregarBiblioteca(), 'Relatório financeiro', cabecalhoGeracao(periodo, contexto))

  documento.tabela(
    'Resumo',
    ['Item', 'Valor'],
    [
      ['Saldo anterior', reais(relatorio.saldoAnterior)],
      ['Entradas', reais(relatorio.entradas)],
      ['Saídas', reais(relatorio.saidas)],
      ['Saldo final', reais(relatorio.saldoFinal)],
    ],
    [1],
  )
  documento.tabela(
    'Entradas por categoria',
    ['Categoria', 'Valor', '%'],
    linhasDeCategorias(relatorio.entradasPorCategoria),
    [1, 2],
  )
  documento.tabela(
    'Saídas por categoria',
    ['Categoria', 'Valor', '%'],
    linhasDeCategorias(relatorio.saidasPorCategoria),
    [1, 2],
  )
  documento.tabela(
    'Lançamentos do período',
    ['Data', 'Tipo', 'Categoria', 'Doador', 'Descrição', 'Valor'],
    relatorio.lancamentos.length === 0
      ? [[SEM_LANCAMENTOS, '', '', '', '', '']]
      : relatorio.lancamentos.map((item) => [
          formatarData(item.data),
          item.tipo === 'entrada' ? 'Entrada' : 'Saída',
          item.categoriaNome,
          item.doadorNome ?? '',
          item.descricao,
          reais(item.valor),
        ]),
    [5],
  )

  return documento.arquivo()
}

export async function gerarPdfDoacoes(
  relatorio: RelatorioDoador,
  periodo: string,
  nomeDoador: string,
  contexto: ContextoExportacao,
) {
  const documento = criarDocumento(
    await carregarBiblioteca(),
    'Relatório de doações',
    cabecalhoGeracao(periodo, contexto, [`Doador: ${nomeDoador}`]),
  )

  documento.tabela('Resumo', ['Item', 'Valor'], [['Total doado', reais(relatorio.totalDoado)]], [1])
  documento.tabela(
    'Doações do período',
    ['Data', 'Categoria', 'Descrição', 'Valor'],
    relatorio.doacoes.length === 0
      ? [[SEM_LANCAMENTOS, '', '', '']]
      : relatorio.doacoes.map((item) => [
          formatarData(item.data),
          item.categoriaNome,
          item.descricao,
          reais(item.valor),
        ]),
    [3],
  )

  return documento.arquivo()
}
