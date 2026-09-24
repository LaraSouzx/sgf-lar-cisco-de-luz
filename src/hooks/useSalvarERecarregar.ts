import { useState } from 'react'

// Estado de erro e execução de uma alteração seguida da recarga da lista, comuns aos hooks de cadastro.
export function useSalvarERecarregar(recarregar: () => Promise<unknown>, mensagemPadrao: string) {
  const [error, setError] = useState<string | null>(null)

  // Devolve se deu certo, para o formulário saber se pode limpar ou fechar.
  async function salvar(alteracao: () => Promise<void>) {
    setError(null)
    try {
      await alteracao()
      await recarregar()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : mensagemPadrao)
      return false
    }
  }

  return { error, setError, salvar }
}
