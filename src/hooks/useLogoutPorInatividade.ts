import { useEffect } from 'react'

const DUAS_HORAS_EM_MS = 2 * 60 * 60 * 1000
const EVENTOS_DE_ATIVIDADE = ['mousedown', 'keydown', 'touchstart', 'scroll']

// Encerra a sessão se a usuária ficar parada: protege os dados financeiros num computador esquecido aberto.
// Usa um único timer reiniciado a cada atividade, em vez de checar o relógio em intervalo.
export function useLogoutPorInatividade(aoExpirar: () => void, limiteEmMs = DUAS_HORAS_EM_MS) {
  useEffect(() => {
    let timer = setTimeout(aoExpirar, limiteEmMs)

    function reiniciar() {
      clearTimeout(timer)
      timer = setTimeout(aoExpirar, limiteEmMs)
    }

    EVENTOS_DE_ATIVIDADE.forEach((evento) => window.addEventListener(evento, reiniciar))
    return () => {
      clearTimeout(timer)
      EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, reiniciar))
    }
  }, [aoExpirar, limiteEmMs])
}
