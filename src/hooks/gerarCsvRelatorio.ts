import { ROTULO_FORMA_RECEBIMENTO } from '../lib/formasDeRecebimento'
import type { ContextoExportacao } from '../types/exportacao'
import type { Lancamento } from '../types/lancamento'
import type { Relatorio, RelatorioDoador } from './calcularRelatorio'
import type { ValorPorCategoria } from './calculosFinanceiros'
import type { CategoriaComparativo, Comparativo, MesComparativo } from './calcularComparativo'
import { formatarData, formatarValorParaPlanilha, formatarVariacao } from './formatacao'
import { abreviacaoDoMes, NOMES_DOS_MESES, rotuloDoPeriodo } from './periodo'

// Ponto e vírgula porque o Excel em português usa a vírgula como decimal.
const SEPARADOR = ';'
const QUEBRA_DE_LINHA = '\r\n'
// Sem o BOM, o Excel abre o arquivo em outra codificação e estraga os acentos.
const BOM = '﻿'
const ROTULO_TIPO: Record<Lancamento['tipo'], string> = { entrada: 'Entrada', saida: 'Saída' }

// Texto vindo do usuário (descrição, nome...) precisa de dois cuidados antes de virar célula:
// aspas quando tem separador/quebra de linha, e um apóstrofo quando o Excel o leria como fórmula.
function celula(texto: string) {
  const semFormula = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto
  return /[;"\r\n]/.test(semFormula) ? `"${semFormula.replace(/"/g, '""')}"` : semFormula
}

const linha = (...campos: string[]) => campos.join(SEPARADOR)

function montarArquivo(linhas: string[]) {
  return BOM + linhas.join(QUEBRA_DE_LINHA)
}

function cabecalhoGeracao({ geradoEm, usuario }: ContextoExportacao) {
  return [linha('Gerado em', formatarData(geradoEm)), linha('Gerado por', celula(usuario))]
}

function secaoCategorias(titulo: string, categorias: ValorPorCategoria[]) {
  return [
    titulo,
    linha('Categoria', 'Valor', 'Percentual'),
    ...categorias.map((item) =>
      linha(celula(item.categoriaNome), formatarValorParaPlanilha(item.valor), `${item.percentual}%`),
    ),
  ]
}

export function gerarCsvRelatorio(relatorio: Relatorio, periodo: string, contexto: ContextoExportacao) {
  return montarArquivo([
    'Relatório financeiro',
    linha('Período', rotuloDoPeriodo(periodo)),
    ...cabecalhoGeracao(contexto),
    '',
    linha('Saldo anterior', formatarValorParaPlanilha(relatorio.saldoAnterior)),
    linha('Entradas', formatarValorParaPlanilha(relatorio.entradas)),
    linha('Saídas', formatarValorParaPlanilha(relatorio.saidas)),
    linha('Saldo final', formatarValorParaPlanilha(relatorio.saldoFinal)),
    '',
    ...secaoCategorias('Entradas por categoria', relatorio.entradasPorCategoria),
    '',
    ...secaoCategorias('Saídas por categoria', relatorio.saidasPorCategoria),
    '',
    'Lançamentos',
    linha('Data', 'Tipo', 'Categoria', 'Doador', 'Forma de recebimento', 'Descrição', 'Valor'),
    ...relatorio.lancamentos.map((item) =>
      linha(
        formatarData(item.data),
        ROTULO_TIPO[item.tipo],
        celula(item.categoriaNome),
        celula(item.doadorNome ?? ''),
        item.formaRecebimento ? ROTULO_FORMA_RECEBIMENTO[item.formaRecebimento] : '',
        celula(item.descricao),
        formatarValorParaPlanilha(item.valor),
      ),
    ),
  ])
}

function secaoCategoriasPorMes(titulo: string, categorias: CategoriaComparativo[], meses: MesComparativo[]) {
  return [
    titulo,
    linha('Categoria', ...meses.map(({ mes }) => abreviacaoDoMes(mes)), 'Total'),
    ...categorias.map((categoria) =>
      linha(
        celula(categoria.categoriaNome),
        ...categoria.valoresPorMes.map(formatarValorParaPlanilha),
        formatarValorParaPlanilha(categoria.total),
      ),
    ),
  ]
}

export function gerarCsvComparativo({ ano, meses, entradasPorCategoria, saidasPorCategoria }: Comparativo, contexto: ContextoExportacao) {
  return montarArquivo([
    'Comparativo mensal',
    linha('Ano', ano),
    ...cabecalhoGeracao(contexto),
    '',
    linha('Mês', 'Entradas', 'Variação entradas', 'Saídas', 'Variação saídas', 'Resultado do mês', 'Saldo final'),
    ...meses.map((mes) =>
      linha(
        NOMES_DOS_MESES[mes.mes - 1] + (mes.emAndamento ? ' (em andamento)' : ''),
        formatarValorParaPlanilha(mes.entradas),
        formatarVariacao(mes.variacaoEntradas),
        formatarValorParaPlanilha(mes.saidas),
        formatarVariacao(mes.variacaoSaidas),
        formatarValorParaPlanilha(mes.resultado),
        formatarValorParaPlanilha(mes.saldoFinal),
      ),
    ),
    '',
    ...secaoCategoriasPorMes('Entradas por categoria', entradasPorCategoria, meses),
    '',
    ...secaoCategoriasPorMes('Saídas por categoria', saidasPorCategoria, meses),
  ])
}

export function gerarCsvDoacoes(
  relatorio: RelatorioDoador,
  periodo: string,
  nomeDoador: string,
  contexto: ContextoExportacao,
) {
  return montarArquivo([
    'Relatório de doações',
    linha('Período', rotuloDoPeriodo(periodo)),
    linha('Doador', celula(nomeDoador)),
    ...cabecalhoGeracao(contexto),
    '',
    linha('Total doado', formatarValorParaPlanilha(relatorio.totalDoado)),
    '',
    'Doações',
    linha('Data', 'Categoria', 'Descrição', 'Valor'),
    ...relatorio.doacoes.map((item) =>
      linha(
        formatarData(item.data),
        celula(item.categoriaNome),
        celula(item.descricao),
        formatarValorParaPlanilha(item.valor),
      ),
    ),
  ])
}
