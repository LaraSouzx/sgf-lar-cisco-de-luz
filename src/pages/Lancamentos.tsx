import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { ComprovanteDialog } from '../components/ComprovanteDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { classeBotao, classeCampo } from '../components/estilos'
import { LancamentoForm } from '../components/LancamentoForm'
import { useCategorias } from '../hooks/useCategorias'
import { useDoadores } from '../hooks/useDoadores'
import { formatarData, formatarValorEmReais } from '../hooks/formatacao'
import { useFiltrosDaUrl } from '../hooks/useFiltrosDaUrl'
import { useLancamentos, type FiltroLancamentos } from '../hooks/useLancamentos'
import type { FormularioLancamento } from '../hooks/validarLancamento'
import type { Lancamento } from '../types/lancamento'

const QUANTIDADE_INICIAL = 10

const FORMATO_MES =/^\d{4}-(0[1-9]|1[0-2])$/

// Filtros vêm da URL (/lancamentos?tipo=entrada&mes=2026-09) para poderem ser linkados de outras telas.
function lerFiltro(parametros: URLSearchParams): FiltroLancamentos {
  const tipo = parametros.get('tipo')
  const mes = parametros.get('mes') ?? ''
  return {
    tipo: tipo === 'entrada' || tipo === 'saida' ? tipo : undefined,
    mes: FORMATO_MES.test(mes) ? mes : undefined,
    semComprovante: parametros.get('comprovante') === 'faltando' || undefined,
  }
}

function LinhaLancamento({
  lancamento,
  onEditar,
  onCancelar,
  onVerComprovante,
}: {
  lancamento: Lancamento
  onEditar: () => void
  onCancelar: () => void
  onVerComprovante: (caminho: string) => void
}) {
  const entrada = lancamento.tipo === 'entrada'
  const corValor = entrada ? 'text-[#2f7d34]' : 'text-[#b3261e]'
  const caminhoDoComprovante = lancamento.comprovanteUrl

  return (
    <li className="flex min-h-14 flex-wrap items-center gap-3 border-b border-[#e8ede5] py-2 last:border-0">
      <span className="w-24 text-sm text-[#4f5c4c]">{formatarData(lancamento.data)}</span>
      <div className="flex min-w-40 flex-1 flex-col">
        <span className={`text-sm font-semibold ${lancamento.cancelado ? 'text-[#8b968a] line-through' : ''}`}>
          {lancamento.descricao}
        </span>
        <span className="text-xs text-[#4f5c4c]">
          {[lancamento.categoriaNome, lancamento.doadorNome].filter(Boolean).join(' · ')}
        </span>
      </div>
      <span className={`text-sm font-bold ${lancamento.cancelado ? 'text-[#8b968a] line-through' : corValor}`}>
        {entrada ? '+' : '−'} {formatarValorEmReais(lancamento.valor)}
      </span>
      {lancamento.cancelado ? (
        <span className="text-right text-xs text-[#8b968a]">Cancelado</span>
      ) : (
        <span className="flex flex-wrap items-center justify-end">
          {caminhoDoComprovante ? (
            <button
              type="button"
              onClick={() => onVerComprovante(caminhoDoComprovante)}
              className={`${classeBotao} text-[#2f7d34]`}
            >
              Ver comprovante
            </button>
          ) : (
            <span className="rounded-md bg-[#fdf1d8] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">
              Sem comprovante
            </span>
          )}
          <button type="button" onClick={onEditar} className={`${classeBotao} text-[#141a14]`}>
            Editar
          </button>
          <button type="button" onClick={onCancelar} className={`${classeBotao} text-[#b3261e]`}>
            Cancelar
          </button>
        </span>
      )}
    </li>
  )
}

export function Lancamentos() {
  const { parametros, atualizarFiltro } = useFiltrosDaUrl()
  const filtro = lerFiltro(parametros)
  const { categorias, error: erroCategorias } = useCategorias()
  const { doadores } = useDoadores()
  const {
    lancamentos,
    isLoading,
    error: erroLancamentos,
    criar,
    editar,
    cancelar,
    abrirComprovante,
    comprovanteAberto,
    fecharComprovante,
  } = useLancamentos(filtro, categorias)
  const error = erroLancamentos ?? erroCategorias
  const [emEdicao, setEmEdicao] = useState<Lancamento>()
  const [aCancelar, setACancelar] = useState<Lancamento>()
  const [mostrarTodos, setMostrarTodos] = useState(false)
  // A lista já vem do mais recente para o mais antigo, então os primeiros são os mais recentes.
  const lancamentosVisiveis = mostrarTodos ? lancamentos : lancamentos.slice(0, QUANTIDADE_INICIAL)

  async function salvar(formulario: FormularioLancamento) {
    const salvou = emEdicao ? await editar(emEdicao.id, formulario) : await criar(formulario)
    if (salvou) setEmEdicao(undefined)
    return salvou
  }

  async function confirmarCancelamento() {
    if (!aCancelar) return
    const { id } = aCancelar
    setACancelar(undefined)
    // Se estava editando o lançamento que acabou de cancelar, fecha o formulário de edição.
    if (await cancelar(id)) setEmEdicao((atual) => (atual?.id === id ? undefined : atual))
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5">
          <h2 className="m-0 mb-3.5 text-base font-semibold">
            {emEdicao ? 'Editar lançamento' : 'Novo lançamento'}
          </h2>
          <LancamentoForm
            key={emEdicao?.id ?? 'novo'}
            categorias={categorias}
            doadores={doadores}
            lancamentoEmEdicao={emEdicao}
            onSubmit={salvar}
            onCancelarEdicao={() => setEmEdicao(undefined)}
          />
        </section>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Lançamentos</h2>
            <div className="flex gap-2.5">
              <input
                aria-label="Filtrar por mês"
                type="month"
                value={filtro.mes ?? ''}
                onChange={(event) => atualizarFiltro('mes', event.target.value)}
                className={classeCampo}
              />
              <select
                aria-label="Filtrar por tipo"
                value={filtro.tipo ?? ''}
                onChange={(event) => atualizarFiltro('tipo', event.target.value)}
                className={classeCampo}
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
              <select
                aria-label="Filtrar por comprovante"
                value={filtro.semComprovante ? 'faltando' : ''}
                onChange={(event) => atualizarFiltro('comprovante', event.target.value)}
                className={classeCampo}
              >
                <option value="">Todos os comprovantes</option>
                <option value="faltando">Sem comprovante</option>
              </select>
            </div>
          </div>

          {isLoading && <p className="text-sm text-[#4f5c4c]">Carregando lançamentos...</p>}
          {!isLoading && lancamentos.length === 0 && (
            <p className="text-sm text-[#4f5c4c]">Nenhum lançamento encontrado.</p>
          )}
          <ul className="m-0 list-none p-0">
            {lancamentosVisiveis.map((lancamento) => (
              <LinhaLancamento
                key={lancamento.id}
                lancamento={lancamento}
                onEditar={() => setEmEdicao(lancamento)}
                onCancelar={() => setACancelar(lancamento)}
                onVerComprovante={abrirComprovante}
              />
            ))}
          </ul>
          {lancamentos.length > QUANTIDADE_INICIAL && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#4f5c4c]">
                Mostrando {lancamentosVisiveis.length} de {lancamentos.length}
              </span>
              <button
                type="button"
                onClick={() => setMostrarTodos((atual) => !atual)}
                className={`${classeBotao} border border-[#dfe6db] bg-white text-[#141a14]`}
              >
                {mostrarTodos ? `Mostrar só os ${QUANTIDADE_INICIAL} mais recentes` : 'Mostrar todos'}
              </button>
            </div>
          )}
        </section>
      </div>

      {comprovanteAberto && <ComprovanteDialog endereco={comprovanteAberto} onFechar={fecharComprovante} />}

      {aCancelar && (
        <ConfirmDialog
          titulo={`Cancelar "${aCancelar.descricao}"?`}
          mensagem="O lançamento continua no histórico, mas deixa de contar no saldo."
          textoConfirmar="Cancelar lançamento"
          onConfirmar={confirmarCancelamento}
          onCancelar={() => setACancelar(undefined)}
        />
      )}
    </AppShell>
  )
}
