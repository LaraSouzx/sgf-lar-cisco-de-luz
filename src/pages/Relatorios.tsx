import { AppShell } from '../components/AppShell'
import { classeBotao, classeCampo } from '../components/estilos'
import { useAuthContext } from '../context/AuthContext'
import type { Relatorio, RelatorioDoador } from '../hooks/calcularRelatorio'
import type { ValorPorCategoria } from '../hooks/calculosFinanceiros'
import { formatarData, formatarValorEmReais } from '../hooks/formatacao'
import { gerarCsvDoacoes, gerarCsvRelatorio } from '../hooks/gerarCsvRelatorio'
import { periodoDoMesAtual, periodoValido, rotuloDoPeriodo } from '../hooks/periodo'
import { useDoadores } from '../hooks/useDoadores'
import { useFiltrosDaUrl } from '../hooks/useFiltrosDaUrl'
import { useRelatorio } from '../hooks/useRelatorio'
import { dataDeHoje } from '../hooks/validarLancamento'
import type { Lancamento } from '../types/lancamento'

const classeCartao = 'rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5'

function baixarCsv(nomeArquivo: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}

const QUANTIDADE_DE_ANOS = 6

// Do ano atual para trás; mantém o ano da URL na lista mesmo que seja mais antigo.
function anosDisponiveis(anoSelecionado: string) {
  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: QUANTIDADE_DE_ANOS }, (_, indice) => String(anoAtual - indice))
  return anos.includes(anoSelecionado) ? anos : [...anos, anoSelecionado].sort().reverse()
}

function Total({ titulo, valor, destaque }: { titulo: string; valor: number; destaque?: 'negativo' }) {
  return (
    <div className={classeCartao}>
      <div className="text-sm font-medium">{titulo}</div>
      <div className={`text-2xl font-bold ${destaque === 'negativo' ? 'text-[#b3261e]' : ''}`}>
        {formatarValorEmReais(valor)}
      </div>
    </div>
  )
}

function TabelaCategorias({ titulo, categorias }: { titulo: string; categorias: ValorPorCategoria[] }) {
  return (
    <section className={classeCartao}>
      <h3 className="m-0 mb-2 text-base font-semibold">{titulo}</h3>
      {categorias.length === 0 ? (
        <p className="text-sm text-[#4f5c4c]">Nenhum lançamento neste período.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {categorias.map((categoria) => (
            <li
              key={categoria.categoriaId}
              className="grid h-9 grid-cols-[1fr_auto_3rem] items-center gap-3 border-b border-[#e8ede5] text-sm last:border-0"
            >
              <span>{categoria.categoriaNome}</span>
              <span className="text-right font-semibold">{formatarValorEmReais(categoria.valor)}</span>
              <span className="text-right text-[#4f5c4c]">{categoria.percentual}%</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ListaLancamentos({ titulo, lancamentos }: { titulo: string; lancamentos: Lancamento[] }) {
  return (
    <section className={classeCartao}>
      <h3 className="m-0 mb-2 text-base font-semibold">{titulo}</h3>
      {lancamentos.length === 0 ? (
        <p className="text-sm text-[#4f5c4c]">Nenhum lançamento neste período.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {lancamentos.map((lancamento) => {
            const entrada = lancamento.tipo === 'entrada'
            return (
              <li
                key={lancamento.id}
                className="flex min-h-12 flex-wrap items-center gap-3 border-b border-[#e8ede5] py-2 text-sm last:border-0"
              >
                <span className="w-24 text-[#4f5c4c]">{formatarData(lancamento.data)}</span>
                <div className="flex min-w-40 flex-1 flex-col">
                  <span className="font-semibold">{lancamento.descricao}</span>
                  <span className="text-xs text-[#4f5c4c]">
                    {[lancamento.categoriaNome, lancamento.doadorNome].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className={`font-bold ${entrada ? 'text-[#2f7d34]' : 'text-[#b3261e]'}`}>
                  {entrada ? '+' : '−'} {formatarValorEmReais(lancamento.valor)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function RelatorioGeral({ relatorio }: { relatorio: Relatorio }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        <Total titulo="Saldo anterior" valor={relatorio.saldoAnterior} />
        <Total titulo="Entradas" valor={relatorio.entradas} />
        <Total titulo="Saídas" valor={relatorio.saidas} />
        <Total
          titulo="Saldo final"
          valor={relatorio.saldoFinal}
          destaque={relatorio.saldoFinal < 0 ? 'negativo' : undefined}
        />
      </div>
      {relatorio.saldoFinal < 0 && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          O saldo ficou negativo neste período: as saídas foram maiores do que o dinheiro em caixa.
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TabelaCategorias titulo="Entradas por categoria" categorias={relatorio.entradasPorCategoria} />
        <TabelaCategorias titulo="Saídas por categoria" categorias={relatorio.saidasPorCategoria} />
      </div>
      <ListaLancamentos titulo="Lançamentos do período" lancamentos={relatorio.lancamentos} />
    </>
  )
}

function RelatorioDoadorView({ relatorio }: { relatorio: RelatorioDoador }) {
  return (
    <>
      <Total titulo="Total doado no período" valor={relatorio.totalDoado} />
      <ListaLancamentos titulo="Doações do período" lancamentos={relatorio.doacoes} />
    </>
  )
}

export function Relatorios() {
  const { parametros, atualizarFiltro } = useFiltrosDaUrl()
  const { session } = useAuthContext()
  const { doadores } = useDoadores()

  const periodoDaUrl = parametros.get('periodo') ?? ''
  const periodo = periodoValido(periodoDaUrl) ? periodoDaUrl : periodoDoMesAtual()
  const doadorId = parametros.get('doador') || undefined
  const anoInteiro = periodo.length === 4
  const nomeDoador = doadores.find((doador) => doador.id === doadorId)?.nome

  const { relatorio, relatorioDoador, isLoading, error } = useRelatorio(periodo, doadorId)

  function trocarModoDoPeriodo(modo: string) {
    const ano = periodo.slice(0, 4)
    atualizarFiltro('periodo', modo === 'ano' ? ano : `${ano}-01`)
  }

  function trocarPeriodo(novoPeriodo: string) {
    // O campo devolve texto vazio/incompleto enquanto a pessoa digita; só vale um período completo.
    if (periodoValido(novoPeriodo)) atualizarFiltro('periodo', novoPeriodo)
  }

  function exportar() {
    const contexto = { geradoEm: dataDeHoje(), usuario: session?.user.email ?? '' }
    if (relatorioDoador) {
      baixarCsv(`doacoes-${periodo}.csv`, gerarCsvDoacoes(relatorioDoador, periodo, nomeDoador ?? '', contexto))
    } else if (relatorio) {
      baixarCsv(`relatorio-${periodo}.csv`, gerarCsvRelatorio(relatorio, periodo, contexto))
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className={`${classeCartao} print:hidden`}>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Tipo de período"
              value={anoInteiro ? 'ano' : 'mes'}
              onChange={(event) => trocarModoDoPeriodo(event.target.value)}
              className={classeCampo}
            >
              <option value="mes">Mês</option>
              <option value="ano">Ano inteiro</option>
            </select>
            {anoInteiro ? (
              <select
                aria-label="Ano"
                value={periodo}
                onChange={(event) => trocarPeriodo(event.target.value)}
                className={classeCampo}
              >
                {anosDisponiveis(periodo).map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label="Mês"
                type="month"
                value={periodo}
                onChange={(event) => trocarPeriodo(event.target.value)}
                className={classeCampo}
              />
            )}
            <select
              aria-label="Filtrar por doador"
              value={doadorId ?? ''}
              onChange={(event) => atualizarFiltro('doador', event.target.value)}
              className={classeCampo}
            >
              <option value="">Todos os lançamentos</option>
              {doadores.map((doador) => (
                <option key={doador.id} value={doador.id}>
                  Doações de {doador.nome}
                </option>
              ))}
            </select>
            <div className="ml-auto flex gap-2.5">
              <button
                type="button"
                onClick={exportar}
                disabled={isLoading || Boolean(error)}
                className={`${classeBotao} border border-[#dfe6db] bg-white text-[#141a14] disabled:opacity-60`}
              >
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={isLoading || Boolean(error)}
                className={`${classeBotao} bg-[#141a14] text-white disabled:opacity-60`}
              >
                Imprimir / salvar PDF
              </button>
            </div>
          </div>
        </section>

        <h2 className="m-0 text-xl font-semibold">
          {doadorId ? `Doações de ${nomeDoador ?? 'doador'}` : 'Relatório financeiro'} · {rotuloDoPeriodo(periodo)}
        </h2>

        {isLoading && <p className="text-sm text-[#4f5c4c]">Carregando relatório...</p>}
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {relatorio && <RelatorioGeral relatorio={relatorio} />}
        {relatorioDoador && <RelatorioDoadorView relatorio={relatorioDoador} />}
      </div>
    </AppShell>
  )
}
