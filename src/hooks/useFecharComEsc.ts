import { useEffect } from 'react'

// Esc fecha o modal, como esperado de qualquer janela sobreposta.
export function useFecharComEsc(aoFechar: () => void) {
  useEffect(() => {
    function aoPressionarTecla(event: KeyboardEvent) {
      if (event.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoPressionarTecla)
    return () => window.removeEventListener('keydown', aoPressionarTecla)
  }, [aoFechar])
}
