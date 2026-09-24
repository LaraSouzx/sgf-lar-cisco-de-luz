import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { DoadorForm } from '../components/DoadorForm'
import { classeBotao, classeCampo } from '../components/estilos'
import { useDoadores, type FormularioDoador } from '../hooks/useDoadores'
import { mascararDocumento } from '../hooks/validarDocumento'
import type { Doador } from '../types/doador'

const ROTULO_TIPO: Record<Doador['tipo'], string> = { pessoa_fisica: 'Pessoa física', empresa: 'Empresa' }

function LinhaDoador({ doador, onEditar }: { doador: Doador; onEditar: () => void }) {
  return (
    <li className="flex min-h-14 flex-wrap items-center gap-3 border-b border-[#e8ede5] py-2 last:border-0">
      <div className="flex min-w-40 flex-1 flex-col">
        <span className="text-sm font-semibold">{doador.nome}</span>
        <span className="text-xs text-[#4f5c4c]">
          {doador.documento ? mascararDocumento(doador.documento) : 'Sem documento'}
        </span>
      </div>
      <span className="rounded-md bg-[#eef4ea] px-2 py-0.5 text-xs font-semibold text-[#3c463a]">
        {ROTULO_TIPO[doador.tipo]}
      </span>
      <button type="button" onClick={onEditar} className={`${classeBotao} text-[#141a14]`}>
        Editar
      </button>
    </li>
  )
}

export function Doadores() {
  const { doadores, isLoading, error, busca, setBusca, criar, editar } = useDoadores()
  const [emEdicao, setEmEdicao] = useState<Doador>()

  async function salvar(formulario: FormularioDoador) {
    const salvou = emEdicao ? await editar(emEdicao.id, formulario) : await criar(formulario)
    if (salvou) setEmEdicao(undefined)
    return salvou
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5">
          <h2 className="m-0 mb-3.5 text-base font-semibold">{emEdicao ? 'Editar doador' : 'Novo doador'}</h2>
          <DoadorForm
            key={emEdicao?.id ?? 'novo'}
            doadorEmEdicao={emEdicao}
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
            <h2 className="m-0 text-base font-semibold">Doadores cadastrados</h2>
            <input
              aria-label="Buscar doador pelo nome"
              type="search"
              placeholder="Buscar pelo nome"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className={classeCampo}
            />
          </div>

          {isLoading && <p className="text-sm text-[#4f5c4c]">Carregando doadores...</p>}
          {!isLoading && doadores.length === 0 && (
            <p className="text-sm text-[#4f5c4c]">
              {busca ? 'Nenhum doador encontrado.' : 'Nenhum doador cadastrado ainda.'}
            </p>
          )}
          <ul className="m-0 list-none p-0">
            {doadores.map((doador) => (
              <LinhaDoador key={doador.id} doador={doador} onEditar={() => setEmEdicao(doador)} />
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
