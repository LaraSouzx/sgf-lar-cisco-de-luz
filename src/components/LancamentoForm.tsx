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
  lancamentoEmEdicao?: Lancamento
  onSubmit: (formulario: FormularioLancamento) => Promise<boolean>
  onCancelarEdicao: () => void
}

function formularioInicial(lancamento?: Lancamento): FormularioLancamento {
  if (!lancamento) {
    return {
      data: dataDeHoje(),
      valor: '',
      tipo: 'saida',
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
  lancamentoEmEdicao,
  onSubmit,
  onCancelarEdicao,
}: LancamentoFormProps) {
  const [formulario, setFormulario] = useState(() => formularioInicial(lancamentoEmEdicao))
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const salvou = await onSubmit(formulario)
    // Ao criar, mantém tipo, data e categoria para lançar vários itens seguidos sem redigitar.
    if (salvou && !editando) {
      setFormulario((atual) => ({ ...atual, valor: '', descricao: '', arquivo: null }))
      setChaveDoCampoDeArquivo((chave) => chave + 1)
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
      <div className="flex flex-col gap-1 sm:col-span-6">
        <label htmlFor="comprovante" className="text-xs font-medium text-[#4f5c4c]">
          Comprovante (foto ou PDF, até 5 MB). Obrigatório a partir de{' '}
          {formatarValorEmReais(VALOR_MINIMO_COMPROVANTE)}.
        </label>
        <input
          id="comprovante"
          key={chaveDoCampoDeArquivo}
          type="file"
          accept={TIPOS_ACEITOS.join(',')}
          onChange={(event) => atualizar('arquivo', event.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {formulario.comprovanteAtual && !formulario.arquivo && (
          <span className="text-xs text-[#2f7d34]">
            Já há um comprovante anexado. Escolha outro arquivo só se quiser substituí-lo.
          </span>
        )}
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
