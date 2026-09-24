import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as lancamentosService from '../services/lancamentosService'
import type { Lancamento } from '../types/lancamento'
import { useRelatorio } from './useRelatorio'

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
    comprovanteUrl: null,
    cancelado: false,
    ...overrides,
  }
}

describe('useRelatorio', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('expõe isLoading: true antes do relatório carregar', () => {
    vi.mocked(lancamentosService.listLancamentos).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useRelatorio('2026-09'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.relatorio).toBeNull()
  })

  it('busca tudo até o fim do período (para o saldo anterior) e calcula o relatório geral', async () => {
    vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([
      lancamento({ id: 'a', data: '2026-08-10', tipo: 'entrada', valor: 1000 }),
      lancamento({ id: 'b', data: '2026-09-10', tipo: 'saida', valor: 300 }),
    ])

    const { result } = renderHook(() => useRelatorio('2026-09'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(lancamentosService.listLancamentos).toHaveBeenCalledWith({ dataFim: '2026-09-30' })
    expect(result.current.relatorio).toMatchObject({ saldoAnterior: 1000, saidas: 300, saldoFinal: 700 })
    expect(result.current.relatorioDoador).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('com doador, busca só o período dele e calcula o total doado, sem relatório geral', async () => {
    vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([
      lancamento({ id: 'a', data: '2026-09-05', valor: 100, doadorId: 'd1' }),
      lancamento({ id: 'b', data: '2026-09-20', valor: 50, doadorId: 'd1' }),
    ])

    const { result } = renderHook(() => useRelatorio('2026-09', 'd1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(lancamentosService.listLancamentos).toHaveBeenCalledWith({
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
      doadorId: 'd1',
    })
    expect(result.current.relatorioDoador?.totalDoado).toBe(150)
    expect(result.current.relatorio).toBeNull()
  })

  it('expõe mensagem de erro genérica quando o carregamento falha', async () => {
    vi.mocked(lancamentosService.listLancamentos).mockRejectedValue(
      new Error('Não foi possível carregar os lançamentos'),
    )

    const { result } = renderHook(() => useRelatorio('2026-09'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Não foi possível carregar os lançamentos')
    expect(result.current.relatorio).toBeNull()
  })

  it('recarrega quando o período muda', async () => {
    vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([])
    const { result, rerender } = renderHook((props: { periodo: string }) => useRelatorio(props.periodo), {
      initialProps: { periodo: '2026-09' },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender({ periodo: '2026' })

    await waitFor(() =>
      expect(lancamentosService.listLancamentos).toHaveBeenLastCalledWith({ dataFim: '2026-12-31' }),
    )
  })

  it('ignora a resposta antiga quando o período muda antes dela chegar', async () => {
    let resolverPrimeira: (lancamentos: Lancamento[]) => void = () => {}
    vi.mocked(lancamentosService.listLancamentos)
      .mockReturnValueOnce(new Promise((resolver) => (resolverPrimeira = resolver)))
      .mockResolvedValueOnce([lancamento({ data: '2026-10-05', tipo: 'entrada', valor: 20 })])

    const { result, rerender } = renderHook((props: { periodo: string }) => useRelatorio(props.periodo), {
      initialProps: { periodo: '2026-09' },
    })
    rerender({ periodo: '2026-10' })
    await waitFor(() => expect(result.current.relatorio?.entradas).toBe(20))

    // A resposta de setembro chega atrasada e não pode sobrescrever a de outubro.
    resolverPrimeira([lancamento({ data: '2026-09-05', tipo: 'entrada', valor: 999 })])
    await Promise.resolve()

    expect(result.current.relatorio?.entradas).toBe(20)
  })
})
