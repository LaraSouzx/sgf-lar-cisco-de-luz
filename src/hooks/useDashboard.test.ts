import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as lancamentosService from '../services/lancamentosService'
import type { Lancamento } from '../types/lancamento'
import { useDashboard } from './useDashboard'

vi.mock('../services/lancamentosService')

function lancamento(overrides: Partial<Lancamento>): Lancamento {
  return {
    id: 'id',
    data: '2026-09-10',
    valor: 100,
    tipo: 'entrada',
    categoriaId: 'cat',
    categoriaNome: 'Categoria',
    usuarioId: 'user',
    doadorId: null,
    doadorNome: null,
    descricao: 'Descrição',
    comprovanteUrl: 'http://exemplo.com/comprovante.pdf',
    cancelado: false,
    ...overrides,
  }
}

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('expõe isLoading: true antes dos lançamentos carregarem', () => {
    vi.mocked(lancamentosService.listLancamentos).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useDashboard())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.resumo).toBeNull()
  })

  it('carrega os lançamentos via lancamentosService e expõe o resumo calculado', async () => {
    vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([
      lancamento({ tipo: 'entrada', valor: 500 }),
      lancamento({ tipo: 'saida', valor: 200 }),
    ])

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.resumo?.saldo).toBe(300)
    expect(result.current.error).toBeNull()
  })

  it('expõe mensagem de erro genérica quando o carregamento falha', async () => {
    vi.mocked(lancamentosService.listLancamentos).mockRejectedValue(
      new Error('Não foi possível carregar os lançamentos'),
    )

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Não foi possível carregar os lançamentos')
    expect(result.current.resumo).toBeNull()
  })
})
