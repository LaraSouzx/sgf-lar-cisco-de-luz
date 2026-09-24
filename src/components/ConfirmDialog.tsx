import { useFecharComEsc } from '../hooks/useFecharComEsc'

type ConfirmDialogProps = {
  titulo: string
  mensagem: string
  textoConfirmar: string
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmDialog({ titulo, mensagem, textoConfirmar, onConfirmar, onCancelar }: ConfirmDialogProps) {
  useFecharComEsc(onCancelar)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141a14]/50 p-4"
      onClick={onCancelar}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensagem"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-6 shadow-xl"
      >
        <h2 id="confirm-titulo" className="m-0 mb-2 text-lg font-semibold">
          {titulo}
        </h2>
        <p id="confirm-mensagem" className="m-0 mb-6 text-sm text-[#4f5c4c]">
          {mensagem}
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            autoFocus
            onClick={onCancelar}
            className="h-11 rounded-xl border border-[#dfe6db] bg-white px-4 text-sm font-semibold text-[#141a14]"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="h-11 rounded-xl bg-[#b3261e] px-4 text-sm font-semibold text-white"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
