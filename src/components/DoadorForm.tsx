import { useState, type FormEvent } from 'react'
import type { FormularioDoador } from '../hooks/useDoadores'
import { formatarDocumento } from '../hooks/validarDocumento'
import type { Doador, TipoDoador } from '../types/doador'
import { classeBotao, classeCampo } from './estilos'

type DoadorFormProps = {
  doadorEmEdicao?: Doador
  onSubmit: (formulario: FormularioDoador) => Promise<boolean>
  onCancelarEdicao: () => void
}

function formularioInicial(doador?: Doador): FormularioDoador {
  if (!doador) return { nome: '', tipo: 'pessoa_fisica', documento: '' }
  // O documento completo só aparece aqui, ao editar; na lista ele fica mascarado.
  return { nome: doador.nome, tipo: doador.tipo, documento: formatarDocumento(doador.documento ?? '') }
}

// A página usa `key` para remontar o formulário ao trocar entre criar e editar, reiniciando o estado.
export function DoadorForm({ doadorEmEdicao, onSubmit, onCancelarEdicao }: DoadorFormProps) {
  const [formulario, setFormulario] = useState(() => formularioInicial(doadorEmEdicao))
  const editando = Boolean(doadorEmEdicao)

  function atualizar<Campo extends keyof FormularioDoador>(campo: Campo, valor: FormularioDoador[Campo]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const salvou = await onSubmit(formulario)
    if (salvou && !editando) setFormulario(formularioInicial())
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2.5 sm:grid-cols-6">
      <input
        aria-label="Nome do doador"
        placeholder="Nome"
        value={formulario.nome}
        onChange={(event) => atualizar('nome', event.target.value)}
        className={`${classeCampo} sm:col-span-3`}
      />
      <select
        aria-label="Tipo do doador"
        value={formulario.tipo}
        onChange={(event) => atualizar('tipo', event.target.value as TipoDoador)}
        className={`${classeCampo} sm:col-span-3`}
      >
        <option value="pessoa_fisica">Pessoa física</option>
        <option value="empresa">Empresa</option>
      </select>
      <input
        aria-label={formulario.tipo === 'empresa' ? 'CNPJ (opcional)' : 'CPF (opcional)'}
        inputMode="numeric"
        placeholder={formulario.tipo === 'empresa' ? 'CNPJ (opcional)' : 'CPF (opcional)'}
        value={formulario.documento}
        onChange={(event) => atualizar('documento', event.target.value)}
        className={`${classeCampo} sm:col-span-4`}
      />
      <div className="flex gap-2.5 sm:col-span-2 sm:justify-end">
        {editando && (
          <button type="button" onClick={onCancelarEdicao} className={`${classeBotao} text-[#3c463a]`}>
            Cancelar edição
          </button>
        )}
        <button type="submit" className={`${classeBotao} bg-[#141a14] text-white`}>
          {editando ? 'Salvar alterações' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
