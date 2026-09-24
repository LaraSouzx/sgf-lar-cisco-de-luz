import { useFecharComEsc } from '../hooks/useFecharComEsc'
import { classeBotao } from './estilos'

type ComprovanteDialogProps = {
  // Link temporário da foto do comprovante.
  endereco: string
  onFechar: () => void
}

export function ComprovanteDialog({ endereco, onFechar }: ComprovanteDialogProps) {
  useFecharComEsc(onFechar)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141a14]/60 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Comprovante do lançamento"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-4 shadow-xl"
      >
        <img
          src={endereco}
          alt="Comprovante do lançamento"
          className="min-h-0 flex-1 rounded-xl bg-white object-contain"
        />
        <button
          type="button"
          autoFocus
          onClick={onFechar}
          className={`${classeBotao} self-end bg-[#141a14] text-white`}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
