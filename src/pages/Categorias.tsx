import { useState, type FormEvent } from 'react'
import { AppShell } from '../components/AppShell'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { classeBotao, classeCampo } from '../components/estilos'
import { useCategorias } from '../hooks/useCategorias'
import type { Categoria } from '../types/categoria'

const ROTULO_TIPO: Record<Categoria['tipo'], string> = { entrada: 'Entrada', saida: 'Saída' }


function LinhaCategoria({
  categoria,
  onEditar,
  onDesativar,
  onReativar,
  onExcluir,
}: {
  categoria: Categoria
  onEditar: (id: string, nome: string) => Promise<boolean>
  onDesativar: (id: string) => void
  onReativar: (id: string) => void
  onExcluir: (id: string) => void
}) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(categoria.nome)
  const [confirmando, setConfirmando] = useState<'desativar' | 'excluir' | null>(null)

  async function salvar(event: FormEvent) {
    event.preventDefault()
    if (await onEditar(categoria.id, nome)) setEditando(false)
  }

  function cancelar() {
    setNome(categoria.nome)
    setEditando(false)
  }

  function confirmar() {
    if (confirmando === 'desativar') onDesativar(categoria.id)
    if (confirmando === 'excluir') onExcluir(categoria.id)
    setConfirmando(null)
  }

  return (
    <li className="flex min-h-14 flex-wrap items-center gap-3 border-b border-[#e8ede5] py-2 last:border-0">
      {editando ? (
        <form onSubmit={salvar} className="flex flex-1 flex-wrap items-center gap-2">
          <input
            aria-label={`Novo nome de ${categoria.nome}`}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className={`${classeCampo} flex-1`}
          />
          <button type="submit" className={`${classeBotao} bg-[#141a14] text-white`}>
            Salvar
          </button>
          <button type="button" onClick={cancelar} className={`${classeBotao} text-[#3c463a]`}>
            Cancelar
          </button>
        </form>
      ) : (
        <>
          <span className={`flex-1 text-sm font-semibold ${categoria.ativa ? '' : 'text-[#8b968a] line-through'}`}>
            {categoria.nome}
          </span>
          <span className="rounded-md bg-[#eef4ea] px-2 py-0.5 text-xs font-semibold text-[#3c463a]">
            {ROTULO_TIPO[categoria.tipo]}
          </span>
          {categoria.ativa ? (
            <>
              <button type="button" onClick={() => setEditando(true)} className={`${classeBotao} text-[#141a14]`}>
                Editar
              </button>
              <button type="button" onClick={() => setConfirmando('desativar')} className={`${classeBotao} text-[#b3261e]`}>
                Desativar
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-[#8b968a]">Desativada</span>
              <button type="button" onClick={() => onReativar(categoria.id)} className={`${classeBotao} text-[#2f7d34]`}>
                Reativar
              </button>
            </>
          )}
          <button type="button" onClick={() => setConfirmando('excluir')} className={`${classeBotao} text-[#b3261e]`}>
            Excluir
          </button>
        </>
      )}
      {confirmando === 'desativar' && (
        <ConfirmDialog
          titulo={`Desativar "${categoria.nome}"?`}
          mensagem="Ela deixa de aparecer em novos lançamentos, mas continua nos lançamentos antigos."
          textoConfirmar="Desativar"
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(null)}
        />
      )}
      {confirmando === 'excluir' && (
        <ConfirmDialog
          titulo={`Excluir "${categoria.nome}"?`}
          mensagem="A categoria é apagada de vez e isso não pode ser desfeito. Só é possível se ela não tiver nenhum lançamento; se tiver, use Desativar."
          textoConfirmar="Excluir"
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </li>
  )
}

export function Categorias() {
  const { categorias, isLoading, error, criar, editar, desativar, reativar, excluir } = useCategorias()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<Categoria['tipo']>('saida')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (await criar(nome, tipo)) setNome('')
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5">
          <h2 className="m-0 mb-3.5 text-base font-semibold">Nova categoria</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2.5">
            <input
              aria-label="Nome da categoria"
              placeholder="Ex: Aluguel"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className={`${classeCampo} min-w-48 flex-1`}
            />
            <select
              aria-label="Tipo da categoria"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as Categoria['tipo'])}
              className={classeCampo}
            >
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
            <button type="submit" className={`${classeBotao} bg-[#141a14] text-white`}>
              Adicionar
            </button>
          </form>
        </section>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5">
          <h2 className="m-0 mb-2 text-base font-semibold">Categorias cadastradas</h2>
          {isLoading && <p className="text-sm text-[#4f5c4c]">Carregando categorias...</p>}
          {!isLoading && categorias.length === 0 && (
            <p className="text-sm text-[#4f5c4c]">Nenhuma categoria cadastrada ainda.</p>
          )}
          <ul className="m-0 list-none p-0">
            {categorias.map((categoria) => (
              <LinhaCategoria
                key={categoria.id}
                categoria={categoria}
                onEditar={editar}
                onDesativar={desativar}
                onReativar={reativar}
                onExcluir={excluir}
              />
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
