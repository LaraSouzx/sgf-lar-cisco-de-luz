import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as lancamentosService from '../services/lancamentosService'
import type { Categoria } from '../types/categoria'
import type { Lancamento } from '../types/lancamento'
import { useLancamentos, type FiltroLancamentos } from './useLancamentos'
import type { FormularioLancamento } from './validarLancamento'

vi.mock('../services/lancamentosService')

const luz: Categoria = { id: 'c1', nome: 'Luz', tipo: 'saida', ativa: true }
const categorias = [luz]

function lancamento(overrides: Partial<Lancamento> = {}): Lancamento {
  return {
    id: 'l1',
    data: '2026-09-10',
    valor: 100,
    tipo: 'saida',
    categoriaId: 'c1',
    categoriaNome: 'Luz',
    usuarioId: 'u1',
    doadorId: null,
    doadorNome: null,
    descricao: 'Conta de luz',
    comprovanteUrl: null,
    cancelado: false,
    ...overrides,
  }
}

function formulario(overrides: Partial<FormularioLancamento> = {}): FormularioLancamento {
  return {
    data: '2026-09-10',
    valor: '150,50',
    tipo: 'saida',
    categoriaId: 'c1',
    descricao: 'Conta de luz',
    doadorId: null,
    ...overrides,
  }
}

async function renderCarregado(
  lancamentos: Lancamento[] = [lancamento()],
  filtro: FiltroLancamentos = {},
) {
  vi.mocked(lancamentosService.listLancamentos).mockResolvedValue(lancamentos)
  const hook = renderHook((props: { filtro: FiltroLancamentos }) => useLancamentos(props.filtro, categorias), {
    initialProps: { filtro },
  })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useLancamentos', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('carregamento', () => {
    it('expõe isLoading: true antes dos lançamentos carregarem', () => {
      vi.mocked(lancamentosService.listLancamentos).mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useLancamentos({}, categorias))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.lancamentos).toEqual([])
    })

    it('carrega os lançamentos via service, sem filtro quando nenhum é informado', async () => {
      const { result } = await renderCarregado()

      expect(lancamentosService.listLancamentos).toHaveBeenCalledWith({})
      expect(result.current.lancamentos).toEqual([lancamento()])
      expect(result.current.error).toBeNull()
    })

    it('converte o mês do filtro no primeiro e no último dia do período', async () => {
      await renderCarregado([], { tipo: 'entrada', mes: '2026-02' })

      expect(lancamentosService.listLancamentos).toHaveBeenCalledWith({
        tipo: 'entrada',
        dataInicio: '2026-02-01',
        dataFim: '2026-02-28',
      })
    })

    it('recarrega quando o filtro muda', async () => {
      const { rerender } = await renderCarregado([], { tipo: 'entrada' })

      rerender({ filtro: { tipo: 'saida' } })

      await waitFor(() =>
        expect(lancamentosService.listLancamentos).toHaveBeenLastCalledWith({ tipo: 'saida' }),
      )
    })

    it('expõe mensagem de erro genérica quando o carregamento falha', async () => {
      vi.mocked(lancamentosService.listLancamentos).mockRejectedValue(
        new Error('Não foi possível carregar os lançamentos'),
      )

      const { result } = renderHook(() => useLancamentos({}, categorias))

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Não foi possível carregar os lançamentos')
    })
  })

  describe('criar', () => {
    it('valida, cria o lançamento com valor numérico e recarrega a lista', async () => {
      const { result } = await renderCarregado([])
      vi.mocked(lancamentosService.criarLancamento).mockResolvedValue(undefined)
      vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([lancamento({ valor: 150.5 })])

      let criou = false
      await act(async () => {
        criou = await result.current.criar(formulario())
      })

      expect(criou).toBe(true)
      expect(lancamentosService.criarLancamento).toHaveBeenCalledWith({
        data: '2026-09-10',
        valor: 150.5,
        tipo: 'saida',
        categoriaId: 'c1',
        descricao: 'Conta de luz',
        doadorId: null,
      })
      expect(result.current.lancamentos).toHaveLength(1)
    })

    it('mostra o erro de validação e não chama o service', async () => {
      const { result } = await renderCarregado([])

      let criou = true
      await act(async () => {
        criou = await result.current.criar(formulario({ valor: '0' }))
      })

      expect(criou).toBe(false)
      expect(result.current.error).toBe('O valor deve ser maior que zero')
      expect(lancamentosService.criarLancamento).not.toHaveBeenCalled()
    })

    it('expõe a mensagem do service quando salvar falha', async () => {
      const { result } = await renderCarregado([])
      vi.mocked(lancamentosService.criarLancamento).mockRejectedValue(
        new Error('Não foi possível salvar o lançamento'),
      )

      let criou = true
      await act(async () => {
        criou = await result.current.criar(formulario())
      })

      expect(criou).toBe(false)
      expect(result.current.error).toBe('Não foi possível salvar o lançamento')
    })
  })

  describe('editar', () => {
    it('valida, atualiza sem enviar o tipo e recarrega a lista', async () => {
      const { result } = await renderCarregado()
      vi.mocked(lancamentosService.editarLancamento).mockResolvedValue(undefined)

      let editou = false
      await act(async () => {
        editou = await result.current.editar('l1', formulario({ descricao: 'Luz de setembro' }))
      })

      expect(editou).toBe(true)
      expect(lancamentosService.editarLancamento).toHaveBeenCalledWith('l1', {
        data: '2026-09-10',
        valor: 150.5,
        categoriaId: 'c1',
        descricao: 'Luz de setembro',
        doadorId: null,
      })
      expect(lancamentosService.listLancamentos).toHaveBeenCalledTimes(2)
    })

    it('mostra o erro de validação e não chama o service', async () => {
      const { result } = await renderCarregado()

      await act(async () => {
        await result.current.editar('l1', formulario({ descricao: '  ' }))
      })

      expect(result.current.error).toBe('Informe a descrição')
      expect(lancamentosService.editarLancamento).not.toHaveBeenCalled()
    })
  })

  describe('cancelar', () => {
    it('cancela o lançamento e ele continua na lista, marcado como cancelado', async () => {
      const { result } = await renderCarregado()
      vi.mocked(lancamentosService.cancelarLancamento).mockResolvedValue(undefined)
      vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([lancamento({ cancelado: true })])

      await act(async () => {
        await result.current.cancelar('l1')
      })

      expect(lancamentosService.cancelarLancamento).toHaveBeenCalledWith('l1')
      expect(result.current.lancamentos).toHaveLength(1)
      expect(result.current.lancamentos[0].cancelado).toBe(true)
    })

    it('expõe a mensagem do service quando cancelar falha', async () => {
      const { result } = await renderCarregado()
      vi.mocked(lancamentosService.cancelarLancamento).mockRejectedValue(
        new Error('Não foi possível cancelar o lançamento'),
      )

      await act(async () => {
        await result.current.cancelar('l1')
      })

      expect(result.current.error).toBe('Não foi possível cancelar o lançamento')
    })
  })
})
