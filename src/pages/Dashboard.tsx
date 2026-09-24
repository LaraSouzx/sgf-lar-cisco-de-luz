import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useDashboard } from '../hooks/useDashboard'
import type { ResumoDashboard } from '../hooks/calcularResumoDashboard'
import { periodoDoMesAtual } from '../hooks/periodo'
import type { Lancamento } from '../types/lancamento'

const CORES_CATEGORIA = ['#141a14', '#2f7d34', '#9fe39a', '#6f7d6c', '#b8c4b3', '#dbe3d7']

// Todo card do dashboard é um link; o realce ao passar o mouse e ao focar indica que dá para clicar.
const classeLink =
  'transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141a14]'

// Destinos dos cards. Os nomes dos filtros na URL são os que as telas de destino leem.
function destinosDoDashboard(mes: string, pendenciasComprovante: number) {
  return {
    lancamentos: '/lancamentos',
    entradasDoMes: `/lancamentos?tipo=entrada&mes=${mes}`,
    saidasDoMes: `/lancamentos?tipo=saida&mes=${mes}`,
    novaEntrada: '/lancamentos?novo=entrada',
    novaSaida: '/lancamentos?novo=saida',
    // Sem pendências, o filtro mostraria uma lista vazia: melhor levar à lista comum.
    prestacaoDeContas: pendenciasComprovante > 0 ? '/lancamentos?comprovante=faltando' : '/lancamentos',
    relatorioDoMes: `/relatorios?periodo=${mes}`,
    doadores: '/doadores',
    relatorios: '/relatorios',
  }
}

function formatMoeda(valor: number) {
  const partes = valor.toFixed(2).split('.')
  const inteiro = Number(partes[0]).toLocaleString('pt-BR')
  return { inteiro, centavos: partes[1] }
}

function formatVariacao(atual: number, anterior: number) {
  if (anterior === 0) return null
  const variacao = ((atual - anterior) / anterior) * 100
  const sinal = variacao >= 0 ? '+' : ''
  return `${sinal}${variacao.toFixed(1).replace('.', ',')}%`
}

function formatData(data: string) {
  const [, mes, dia] = data.split('-')
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${dia} ${meses[Number(mes) - 1]}`
}

function CartaoSaldo({ resumo, destino }: { resumo: ResumoDashboard; destino: string }) {
  const { inteiro, centavos } = formatMoeda(resumo.saldo)
  const resultadoMes = resumo.entradasMes - resumo.saidasMes
  const resultadoMesAnterior = resumo.entradasMesAnterior - resumo.saidasMesAnterior
  const diferencaEntreMeses = resultadoMes - resultadoMesAnterior

  return (
    <Link
      to={destino}
      className={`col-span-12 flex flex-col justify-between rounded-[20px] bg-[#141a14] p-6 text-white md:col-span-5 ${classeLink}`}
    >
      <div className="text-[15px] font-medium">Saldo em caixa</div>
      <div className="text-4xl font-bold tracking-[-0.02em]">
        R$ {inteiro}
        <span className="text-xl font-medium text-[#b9c4b6]">,{centavos}</span>
      </div>
      <div className="flex items-center gap-2.5 text-sm">
        <span className="rounded-lg bg-[#26312a] px-2.5 py-1 font-semibold text-[#9fe39a]">
          {diferencaEntreMeses >= 0 ? '+' : '-'} R$ {formatMoeda(Math.abs(diferencaEntreMeses)).inteiro}
        </span>
        <span className="text-[#b9c4b6]">
          {diferencaEntreMeses >= 0 ? 'a mais' : 'a menos'} que no mês passado
        </span>
      </div>
    </Link>
  )
}

function CartaoResumo({
  titulo,
  valor,
  variacao,
  corVariacao,
  extra,
  destino,
}: {
  titulo: string
  valor: number
  variacao: string | null
  corVariacao: string
  extra?: string
  destino: string
}) {
  const { inteiro, centavos } = formatMoeda(valor)
  return (
    <Link
      to={destino}
      className={`flex flex-col justify-between rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5 ${classeLink}`}
    >
      <div className="text-sm font-medium">{titulo}</div>
      <div className="text-2xl font-bold tracking-[-0.01em]">
        R$ {inteiro}
        <span className="text-[15px] font-medium text-[#5d6a5a]">,{centavos}</span>
      </div>
      <div className="text-xs text-[#4f5c4c]">
        {variacao && (
          <span className={`mr-1 rounded-md px-2 py-0.5 font-semibold ${corVariacao}`}>{variacao}</span>
        )}
        {extra ?? 'vs. mês passado'}
      </div>
    </Link>
  )
}

function GraficoCategorias({ gastos, saidasMes }: { gastos: ResumoDashboard['gastosPorCategoria']; saidasMes: number }) {
  if (gastos.length === 0) {
    return <p className="text-sm text-[#4f5c4c]">Nenhuma saída registrada neste mês ainda.</p>
  }

  const circunferencia = 2 * Math.PI * 70
  const fatias = gastos.reduce<{ comprimento: number; offset: number }[]>((acc, gasto) => {
    const anterior = acc.at(-1)
    const acumulado = anterior ? anterior.offset + anterior.comprimento : 0
    acc.push({ comprimento: (gasto.percentual / 100) * circunferencia, offset: acumulado })
    return acc
  }, [])

  return (
    <div className="flex items-center gap-8">
      <div className="relative h-49 w-49 shrink-0">
        <svg width="196" height="196" viewBox="0 0 196 196" role="img" aria-label="Gráfico de gastos por categoria">
          <g transform="rotate(-90 98 98)" fill="none" strokeWidth="30">
            {gastos.map((gasto, index) => (
              <circle
                key={gasto.categoriaId}
                cx="98"
                cy="98"
                r="70"
                stroke={CORES_CATEGORIA[index % CORES_CATEGORIA.length]}
                strokeDasharray={`${fatias[index].comprimento} ${circunferencia}`}
                strokeDashoffset={-fatias[index].offset}
              />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <div className="text-xs text-[#4f5c4c]">Total gasto</div>
          <div className="text-xl font-bold">R$ {formatMoeda(saidasMes).inteiro}</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        {gastos.map((gasto, index) => (
          <div
            key={gasto.categoriaId}
            className="grid h-9 grid-cols-[1fr_110px_50px] items-center border-b border-[#e8ede5] text-sm last:border-0"
          >
            <span className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ background: CORES_CATEGORIA[index % CORES_CATEGORIA.length] }}
              />
              {gasto.categoriaNome}
            </span>
            <span className="text-right font-semibold">
              R$ {formatMoeda(gasto.valor).inteiro},{formatMoeda(gasto.valor).centavos}
            </span>
            <span className="text-right text-[#4f5c4c]">{gasto.percentual}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CartaoLancamento({ lancamento }: { lancamento: Lancamento }) {
  const cor = lancamento.tipo === 'entrada' ? 'text-[#2f7d34]' : 'text-[#b3261e]'
  const sinal = lancamento.tipo === 'entrada' ? '+' : '−'
  const { inteiro, centavos } = formatMoeda(lancamento.valor)

  return (
    <div className="flex h-11 items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-sm font-semibold">{lancamento.descricao}</div>
        <div className="text-xs text-[#4f5c4c]">
          {lancamento.categoriaNome} · {formatData(lancamento.data)}
        </div>
      </div>
      <div className={`text-sm font-bold ${cor}`}>
        {sinal} R$ {inteiro},{centavos}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { resumo, isLoading, error } = useDashboard()
  const destinos = destinosDoDashboard(periodoDoMesAtual(), resumo?.pendenciasComprovante ?? 0)

  return (
    <AppShell>
      {isLoading && <p className="text-center text-[#4f5c4c]">Carregando painel...</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {resumo && (
        <div className="grid grid-cols-12 gap-5">
          <CartaoSaldo resumo={resumo} destino={destinos.lancamentos} />

          <section className="col-span-12 grid grid-cols-1 gap-5 sm:grid-cols-3 md:col-span-7">
            <CartaoResumo
              titulo="Entradas do mês"
              valor={resumo.entradasMes}
              variacao={formatVariacao(resumo.entradasMes, resumo.entradasMesAnterior)}
              corVariacao="bg-[#eef4ea] text-[#2f7d34]"
              destino={destinos.entradasDoMes}
            />
            <CartaoResumo
              titulo="Saídas do mês"
              valor={resumo.saidasMes}
              variacao={formatVariacao(resumo.saidasMes, resumo.saidasMesAnterior)}
              corVariacao="bg-[#fbeeec] text-[#b3261e]"
              destino={destinos.saidasDoMes}
            />
            <CartaoResumo
              titulo="Doações do mês"
              valor={resumo.doacoesMes}
              variacao={`${resumo.doadoresMes} doadores`}
              corVariacao="bg-[#eef4ea] text-[#2f7d34]"
              extra="neste mês"
              destino={destinos.entradasDoMes}
            />
          </section>

          <Link
            to={destinos.relatorioDoMes}
            className={`col-span-12 rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-6 md:col-span-7 ${classeLink}`}
          >
            <h2 className="m-0 mb-3.5 text-base font-semibold">Para onde foi o dinheiro</h2>
            <GraficoCategorias gastos={resumo.gastosPorCategoria} saidasMes={resumo.saidasMes} />
          </Link>

          <div className="col-span-12 flex flex-col gap-5 md:col-span-5">
            <Link
              to={destinos.prestacaoDeContas}
              className={`flex flex-1 items-center gap-5 rounded-[20px] bg-[#141a14] p-6 text-white ${classeLink}`}
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="text-sm text-[#c9d3c5]">Prestação de contas</div>
                {resumo.pendenciasComprovante > 0 ? (
                  <div className="text-lg leading-snug font-semibold">
                    Faltam {resumo.pendenciasComprovante} lançamento
                    {resumo.pendenciasComprovante > 1 ? 's' : ''} sem comprovante.
                  </div>
                ) : (
                  <div className="text-lg leading-snug font-semibold">
                    Todos os lançamentos têm comprovante registrado.
                  </div>
                )}
              </div>
            </Link>

            <section className="rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5">
              <h2 className="m-0 mb-3.5 text-base font-semibold">Ações rápidas</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { rotulo: 'Nova entrada', destino: destinos.novaEntrada },
                  { rotulo: 'Nova saída', destino: destinos.novaSaida },
                  { rotulo: 'Novo doador', destino: destinos.doadores },
                  { rotulo: 'Exportar', destino: destinos.relatorios },
                ].map(({ rotulo, destino }) => (
                  <Link
                    key={rotulo}
                    to={destino}
                    className={`flex h-18 flex-col items-center justify-center gap-2 rounded-xl border border-[#e0e7dc] bg-[#eff3ec] text-xs font-medium text-[#141a14] hover:bg-[#e6ece2] ${classeLink}`}
                  >
                    {rotulo}
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <Link
            to={destinos.doadores}
            className={`col-span-12 rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5 md:col-span-7 ${classeLink}`}
          >
            <h2 className="m-0 mb-3 text-base font-semibold">Doações recentes</h2>
            {resumo.doacoesRecentes.length === 0 ? (
              <p className="text-sm text-[#4f5c4c]">Nenhuma doação registrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                {resumo.doacoesRecentes.map((doacao) => (
                  <div key={doacao.id} className="rounded-2xl border border-[#e0e7dc] bg-white p-4">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dff3dc] text-[13px] font-bold text-[#1f5a23]">
                        {(doacao.doadorNome ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-semibold">{doacao.doadorNome ?? 'Doador'}</div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-[#2f7d34]">
                        + R$ {formatMoeda(doacao.valor).inteiro},{formatMoeda(doacao.valor).centavos}
                      </span>
                      <span className="text-xs text-[#4f5c4c]">{formatData(doacao.data)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Link>

          <Link
            to={destinos.lancamentos}
            className={`col-span-12 rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5 md:col-span-5 ${classeLink}`}
          >
            <h2 className="m-0 mb-3 text-base font-semibold">Últimos lançamentos</h2>
            {resumo.ultimosLancamentos.length === 0 ? (
              <p className="text-sm text-[#4f5c4c]">Nenhum lançamento registrado ainda.</p>
            ) : (
              resumo.ultimosLancamentos.map((lancamento) => (
                <CartaoLancamento key={lancamento.id} lancamento={lancamento} />
              ))
            )}
          </Link>
        </div>
      )}
    </AppShell>
  )
}
