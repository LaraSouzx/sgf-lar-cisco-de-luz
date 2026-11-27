import { useState } from 'react'
import { useFecharComEsc } from '../hooks/useFecharComEsc'
import { classeBotao } from './estilos'

const EMAIL_DE_SUPORTE = 'larasouzadev@gmail.com'
const LINK_DE_SUPORTE = `mailto:${EMAIL_DE_SUPORTE}?subject=${encodeURIComponent('Ajuda com o sistema financeiro')}`

export function AjudaDialog({ onFechar }: { onFechar: () => void }) {
  useFecharComEsc(onFechar)
  const [textoCopiar, setTextoCopiar] = useState('Copiar')

  // A cópia pode ser recusada pelo navegador; nesse caso o endereço continua selecionável na tela.
  async function copiarEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL_DE_SUPORTE)
      setTextoCopiar('Copiado!')
    } catch {
      setTextoCopiar('Não copiou')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141a14]/50 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajuda-titulo"
        aria-describedby="ajuda-mensagem"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-md flex-col items-center rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-6 text-center shadow-xl"
      >
        <div aria-hidden="true" className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#141a14]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9fe39a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3.5 7l8.5 6 8.5-6" />
          </svg>
        </div>
        <h2 id="ajuda-titulo" className="m-0 mb-2 text-xl font-semibold">
          Precisa de ajuda?
        </h2>
        <p id="ajuda-mensagem" className="m-0 mb-4 text-sm leading-relaxed text-[#4f5c4c]">
          Encontrou algum problema no site ou quer pedir uma mudança? Mande um e-mail contando o que
          aconteceu e em qual tela você estava.
        </p>
        {/* O endereço fica em texto para ser copiado caso o computador não tenha programa de e-mail */}
        <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-3 rounded-xl bg-[#e9eee6] py-2 pr-2 pl-4">
          <span className="min-w-0 flex-1 text-left text-sm font-semibold break-all select-all">{EMAIL_DE_SUPORTE}</span>
          <button
            type="button"
            onClick={copiarEmail}
            aria-live="polite"
            className={`${classeBotao} border border-[#dfe6db] bg-white text-[#141a14]`}
          >
            {textoCopiar}
          </button>
        </div>
        <div className="flex w-full gap-2.5">
          <button
            type="button"
            autoFocus
            onClick={onFechar}
            className={`${classeBotao} flex-1 border border-[#dfe6db] bg-white text-[#141a14]`}
          >
            Fechar
          </button>
          <a
            href={LINK_DE_SUPORTE}
            className={`${classeBotao} flex flex-1 items-center justify-center bg-[#141a14] text-white no-underline`}
          >
            Enviar e-mail
          </a>
        </div>
      </div>
    </div>
  )
}
