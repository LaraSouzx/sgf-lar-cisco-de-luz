import { useState, type FormEvent } from 'react'
import { TIPOS_ACEITOS, VALOR_MINIMO_COMPROVANTE } from '../lib/regrasDeComprovante'
import { formatarValorEmReais } from '../hooks/formatacao'
import {
  categoriasDisponiveis,
  dataDeHoje,
  type FormularioLancamento,
} from '../hooks/validarLancamento'
import type { Categoria } from '../types/categoria'
import type { Doador } from '../types/doador'
import type { Lancamento, TipoLancamento } from '../types/lancamento'
import { classeBotao, classeCampo } from './estilos'

type LancamentoFormProps = {
  categorias: Categoria[]
  doadores: Doador[]
  // Tipo com que o formulário de um lançamento novo abre (ex: vindo de "Nova entrada" no dashboard).
  tipoInicial?: TipoLancamento
  lancamentoEmEdicao?: Lancamento
  onSubmit: (formulario: FormularioLancamento) => Promise<boolean>
  onCancelarEdicao: () => void
}

function formularioInicial(lancamento?: Lancamento, tipoInicial: TipoLancamento = 'saida'): FormularioLancamento {
  if (!lancamento) {
    return {
      data: dataDeHoje(),
      valor: '',
      tipo: tipoInicial,
      categoriaId: '',
      descricao: '',
      doadorId: null,
      arquivo: null,
      comprovanteAtual: null,
    }
  }
  return {
    data: lancamento.data,
    valor: lancamento.valor.toFixed(2).replace('.', ','),
    tipo: lancamento.tipo,
    categoriaId: lancamento.categoriaId,
    descricao: lancamento.descricao,
    doadorId: lancamento.doadorId,
    arquivo: null,
    comprovanteAtual: lancamento.comprovanteUrl,
  }
}

// A página usa `key` para remontar o formulário ao trocar entre criar e editar, reiniciando o estado.
export function LancamentoForm({
  categorias,
  doadores,
  tipoInicial,
  lancamentoEmEdicao,
  onSubmit,
  onCancelarEdicao,
}: LancamentoFormProps) {
  const [formulario, setFormulario] = useState(() => formularioInicial(lancamentoEmEdicao, tipoInicial))
  // O campo de arquivo não é controlado; mudar a chave é o jeito de esvaziá-lo depois de salvar.
  const [chaveDoCampoDeArquivo, setChaveDoCampoDeArquivo] = useState(0)
  const editando = Boolean(lancamentoEmEdicao)

  function atualizar<Campo extends keyof FormularioLancamento>(campo: Campo, valor: FormularioLancamento[Campo]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  function trocarTipo(tipo: TipoLancamento) {
    // A categoria escolhida só vale para um tipo, então volta para "escolha" ao trocar; doador só existe em entrada.
    setFormulario((atual) => ({ ...atual, tipo, categoriaId: '', doadorId: null }))
  }

  function removerArquivo() {
    setFormulario((atual) => ({ ...atual, arquivo: null }))
    setChaveDoCampoDeArquivo((chave) => chave + 1)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const salvou = await onSubmit(formulario)
    // Ao criar, mantém tipo, data e categoria para lançar vários itens seguidos sem redigitar.
    if (salvou && !editando) {
      setFormulario((atual) => ({ ...atual, valor: '', descricao: '' }))
      removerArquivo()
    }
  }

  const opcoesCategoria = categoriasDisponiveis(categorias, formulario.tipo, lancamentoEmEdicao?.categoriaId)

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2.5 sm:grid-cols-6">
      <select
        aria-label="Tipo do lançamento"
        value={formulario.tipo}
        disabled={editando}
        onChange={(event) => trocarTipo(event.target.value as TipoLancamento)}
        className={`${classeCampo} sm:col-span-2`}
      >
        <option value="saida">Saída</option>
        <option value="entrada">Entrada</option>
      </select>
      <input
        aria-label="Data"
        type="date"
        max={dataDeHoje()}
        value={formulario.data}
        onChange={(event) => atualizar('data', event.target.value)}
        className={`${classeCampo} sm:col-span-2`}
      />
      <input
        aria-label="Valor em reais"
        inputMode="decimal"
        placeholder="Valor, ex: 1.234,56"
        value={formulario.valor}
        onChange={(event) => atualizar('valor', event.target.value)}
        className={`${classeCampo} sm:col-span-2`}
      />
      <select
        aria-label="Categoria"
        value={formulario.categoriaId}
        onChange={(event) => atualizar('categoriaId', event.target.value)}
        className={`${classeCampo} sm:col-span-2`}
      >
        <option value="">
          {opcoesCategoria.length === 0
            ? `Nenhuma categoria de ${formulario.tipo === 'entrada' ? 'entrada' : 'saída'} ativa`
            : 'Escolha a categoria'}
        </option>
        {opcoesCategoria.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nome}
          </option>
        ))}
      </select>
      {formulario.tipo === 'entrada' && (
        <select
          aria-label="Doador"
          value={formulario.doadorId ?? ''}
          onChange={(event) => atualizar('doadorId', event.target.value || null)}
          className={`${classeCampo} sm:col-span-2`}
        >
          <option value="">Sem doador</option>
          {doadores.map((doador) => (
            <option key={doador.id} value={doador.id}>
              {doador.nome}
            </option>
          ))}
        </select>
      )}
      <input
        aria-label="Descrição"
        placeholder="Descrição"
        value={formulario.descricao}
        onChange={(event) => atualizar('descricao', event.target.value)}
        className={`${classeCampo} ${formulario.tipo === 'entrada' ? 'sm:col-span-2' : 'sm:col-span-4'}`}
      />
      <div className="flex flex-col gap-1.5 sm:col-span-6">
        <span className="text-xs font-medium text-[#4f5c4c]">
          Comprovante (foto ou PDF, até 5 MB). Obrigatório a partir de{' '}
          {formatarValorEmReais(VALOR_MINIMO_COMPROVANTE)}.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {/* O campo nativo é escondido: o botão de verdade é o rótulo, que abre o seletor de arquivos. */}
          <input
            id="comprovante"
            key={chaveDoCampoDeArquivo}
            type="file"
            accept={TIPOS_ACEITOS.join(',')}
            onChange={(event) => atualizar('arquivo', event.target.files?.[0] ?? null)}
            className="peer sr-only"
          />
          <label
            htmlFor="comprovante"
            className={`${classeBotao} flex cursor-pointer items-center border border-dashed border-[#9aa896] bg-white text-[#141a14] peer-focus-visible:outline-2 peer-focus-visible:outline-[#141a14]`}
          >
            {formulario.arquivo ? 'Trocar arquivo' : 'Anexar comprovante'}
          </label>
          {formulario.arquivo ? (
            <>
              <span className="max-w-xs truncate text-sm">{formulario.arquivo.name}</span>
              <button type="button" onClick={removerArquivo} className={`${classeBotao} text-[#b3261e]`}>
                Remover
              </button>
            </>
          ) : formulario.comprovanteAtual ? (
            <span className="text-sm text-[#2f7d34]">Comprovante já anexado (escolha outro arquivo para substituí-lo)</span>
          ) : (
            <span className="text-sm text-[#8b968a]">Nenhum arquivo escolhido</span>
          )}
        </div>
      </div>
      <div className="flex gap-2.5 sm:col-span-6 sm:justify-end">
        {editando && (
          <button type="button" onClick={onCancelarEdicao} className={`${classeBotao} text-[#3c463a]`}>
            Cancelar edição
          </button>
        )}
        <button type="submit" className={`${classeBotao} bg-[#141a14] text-white`}>
          {editando ? 'Salvar alterações' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
