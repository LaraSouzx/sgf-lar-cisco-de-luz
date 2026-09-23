import { useState, type FormEvent } from 'react'
import {
  categoriasDisponiveis,
  dataDeHoje,
  type FormularioLancamento,
} from '../hooks/validarLancamento'
import type { Categoria } from '../types/categoria'
import type { Lancamento, TipoLancamento } from '../types/lancamento'
import { classeBotao, classeCampo } from './estilos'

type LancamentoFormProps = {
  categorias: Categoria[]
  lancamentoEmEdicao?: Lancamento
  onSubmit: (formulario: FormularioLancamento) => Promise<boolean>
  onCancelarEdicao: () => void
}

function formularioInicial(lancamento?: Lancamento): FormularioLancamento {
  if (!lancamento) {
    return { data: dataDeHoje(), valor: '', tipo: 'saida', categoriaId: '', descricao: '' }
  }
  return {
    data: lancamento.data,
    valor: lancamento.valor.toFixed(2).replace('.', ','),
    tipo: lancamento.tipo,
    categoriaId: lancamento.categoriaId,
    descricao: lancamento.descricao,
  }
}

// A página usa `key` para remontar o formulário ao trocar entre criar e editar, reiniciando o estado.
export function LancamentoForm({ categorias, lancamentoEmEdicao, onSubmit, onCancelarEdicao }: LancamentoFormProps) {
  const [formulario, setFormulario] = useState(() => formularioInicial(lancamentoEmEdicao))
  const editando = Boolean(lancamentoEmEdicao)

  function atualizar<Campo extends keyof FormularioLancamento>(campo: Campo, valor: FormularioLancamento[Campo]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  function trocarTipo(tipo: TipoLancamento) {
    // A categoria escolhida só vale para um tipo, então volta para "escolha" ao trocar.
    setFormulario((atual) => ({ ...atual, tipo, categoriaId: '' }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const salvou = await onSubmit(formulario)
    // Ao criar, mantém tipo, data e categoria para lançar vários itens seguidos sem redigitar.
    if (salvou && !editando) setFormulario((atual) => ({ ...atual, valor: '', descricao: '' }))
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
        <option value="">Escolha a categoria</option>
        {opcoesCategoria.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nome}
          </option>
        ))}
      </select>
      <input
        aria-label="Descrição"
        placeholder="Descrição"
        value={formulario.descricao}
        onChange={(event) => atualizar('descricao', event.target.value)}
        className={`${classeCampo} sm:col-span-4`}
      />
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
