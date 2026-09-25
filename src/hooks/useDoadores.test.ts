import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as doadorService from '../services/doadorService'
import type { Doador } from '../types/doador'
import { useDoadores } from './useDoadores'

vi.mock('../services/doadorService')

const maria: Doador = { id: 'd1', nome: 'Maria Silva', tipo: 'pessoa_fisica', documento: '52998224725' }
const jose: Doador = { id: 'd2', nome: 'José Souza', tipo: 'pessoa_fisica', documento: null }
const padaria: Doador = { id: 'd3', nome: 'Padaria Boa', tipo: 'empresa', documento: '11222333000181' }

async function renderCarregado(doadores: Doador[] = [maria, jose, padaria]) {
  vi.mocked(doadorService.listarDoadores).mockResolvedValue(doadores)
  const hook = renderHook(() => useDoadores())
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useDoadores', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('carregamento', () => {
    it('expõe isLoading: true antes dos doadores carregarem', () => {
      vi.mocked(doadorService.listarDoadores).mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useDoadores())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.doadores).toEqual([])
    })

    it('carrega os doadores via doadorService', async () => {
      const { result } = await renderCarregado()

      expect(result.current.doadores).toEqual([maria, jose, padaria])
      expect(result.current.error).toBeNull()
    })

    it('expõe mensagem de erro genérica quando o carregamento falha', async () => {
      vi.mocked(doadorService.listarDoadores).mockRejectedValue(
        new Error('Não foi possível carregar os doadores'),
      )

      const { result } = renderHook(() => useDoadores())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Não foi possível carregar os doadores')
    })
  })

  describe('busca', () => {
    it('filtra pelo nome ignorando maiúsculas e acentos', async () => {
      const { result } = await renderCarregado()

      act(() => result.current.setBusca('jose'))

      expect(result.current.doadores).toEqual([jose])
    })

    it('mostra todos de novo quando a busca é limpa', async () => {
      const { result } = await renderCarregado()

      act(() => result.current.setBusca('padaria'))
      act(() => result.current.setBusca(''))

      expect(result.current.doadores).toHaveLength(3)
    })
  })

  describe('criar', () => {
    it('cria o doador com nome limpo e documento só com dígitos, e recarrega a lista', async () => {
      const { result } = await renderCarregado([])
      vi.mocked(doadorService.criarDoador).mockResolvedValue(undefined)
      vi.mocked(doadorService.listarDoadores).mockResolvedValue([maria])

      let criou = false
      await act(async () => {
        criou = await result.current.criar({
          nome: '  Maria Silva ',
          tipo: 'pessoa_fisica',
          documento: '529.982.247-25',
        })
      })

      expect(criou).toBe(true)
      expect(doadorService.criarDoador).toHaveBeenCalledWith({
        nome: 'Maria Silva',
        tipo: 'pessoa_fisica',
        documento: '52998224725',
      })
      expect(result.current.doadores).toEqual([maria])
    })

    it('grava documento null quando o doador não informou documento', async () => {
      const { result } = await renderCarregado([])
      vi.mocked(doadorService.criarDoador).mockResolvedValue(undefined)

      await act(async () => {
        await result.current.criar({ nome: 'José Souza', tipo: 'pessoa_fisica', documento: '  ' })
      })

      expect(doadorService.criarDoador).toHaveBeenCalledWith({
        nome: 'José Souza',
        tipo: 'pessoa_fisica',
        documento: null,
      })
    })

    it('bloqueia nome vazio antes de chamar o service', async () => {
      const { result } = await renderCarregado([])

      await act(async () => {
        await result.current.criar({ nome: '   ', tipo: 'pessoa_fisica', documento: '' })
      })

      expect(result.current.error).toBe('Informe o nome do doador')
      expect(doadorService.criarDoador).not.toHaveBeenCalled()
    })

    it('bloqueia CPF inválido e CPF em doador do tipo empresa antes de chamar o service', async () => {
      const { result } = await renderCarregado([])

      await act(async () => {
        await result.current.criar({ nome: 'Ana', tipo: 'pessoa_fisica', documento: '111.111.111-11' })
      })
      expect(result.current.error).toBe('CPF inválido')

      await act(async () => {
        await result.current.criar({ nome: 'Loja', tipo: 'empresa', documento: '529.982.247-25' })
      })
      expect(result.current.error).toBe('CNPJ inválido')
      expect(doadorService.criarDoador).not.toHaveBeenCalled()
    })

    it('bloqueia documento já cadastrado, mesmo digitado com pontuação diferente e com a busca ativa', async () => {
      const { result } = await renderCarregado()
      act(() => result.current.setBusca('padaria'))

      await act(async () => {
        await result.current.criar({ nome: 'Outra Maria', tipo: 'pessoa_fisica', documento: '52998224725' })
      })

      expect(result.current.error).toBe('Já existe um doador com esse documento')
      expect(doadorService.criarDoador).not.toHaveBeenCalled()
    })

    it('expõe a mensagem do service quando salvar falha', async () => {
      const { result } = await renderCarregado([])
      vi.mocked(doadorService.criarDoador).mockRejectedValue(
        new Error('Não foi possível salvar o doador'),
      )

      let criou = true
      await act(async () => {
        criou = await result.current.criar({ nome: 'Ana', tipo: 'pessoa_fisica', documento: '' })
      })

      expect(criou).toBe(false)
      expect(result.current.error).toBe('Não foi possível salvar o doador')
    })
  })

  describe('editar', () => {
    it('bloqueia trocar o documento pelo de outro doador', async () => {
      const { result } = await renderCarregado()

      let editou = true
      await act(async () => {
        // 529.982.247-25 é o CPF da Maria.
        editou = await result.current.editar('d2', {
          nome: 'José Souza',
          tipo: 'pessoa_fisica',
          documento: '529.982.247-25',
        })
      })

      expect(editou).toBe(false)
      expect(result.current.error).toBe('Já existe um doador com esse documento')
      expect(doadorService.editarDoador).not.toHaveBeenCalled()
    })

    it('atualiza o doador e recarrega a lista', async () => {
      const { result } = await renderCarregado()
      vi.mocked(doadorService.editarDoador).mockResolvedValue(undefined)

      let editou = false
      await act(async () => {
        editou = await result.current.editar('d2', {
          nome: 'José S. Souza',
          tipo: 'pessoa_fisica',
          documento: '',
        })
      })

      expect(editou).toBe(true)
      expect(doadorService.editarDoador).toHaveBeenCalledWith('d2', {
        nome: 'José S. Souza',
        tipo: 'pessoa_fisica',
        documento: null,
      })
      expect(doadorService.listarDoadores).toHaveBeenCalledTimes(2)
    })

    it('não acusa duplicidade do doador com o próprio documento', async () => {
      const { result } = await renderCarregado()
      vi.mocked(doadorService.editarDoador).mockResolvedValue(undefined)

      await act(async () => {
        await result.current.editar('d1', {
          nome: 'Maria da Silva',
          tipo: 'pessoa_fisica',
          documento: '529.982.247-25',
        })
      })

      expect(result.current.error).toBeNull()
      expect(doadorService.editarDoador).toHaveBeenCalledWith('d1', {
        nome: 'Maria da Silva',
        tipo: 'pessoa_fisica',
        documento: '52998224725',
      })
    })
  })

  describe('excluir', () => {
    it('exclui o doador e ele some da lista', async () => {
      const { result } = await renderCarregado()
      vi.mocked(doadorService.excluirDoador).mockResolvedValue(undefined)
      vi.mocked(doadorService.listarDoadores).mockResolvedValue([jose, padaria])

      let excluiu = false
      await act(async () => {
        excluiu = await result.current.excluir('d1')
      })

      expect(excluiu).toBe(true)
      expect(doadorService.excluirDoador).toHaveBeenCalledWith('d1')
      expect(result.current.doadores).toEqual([jose, padaria])
    })

    it('mostra a orientação do service e mantém a lista quando não pode excluir', async () => {
      const { result } = await renderCarregado()
      vi.mocked(doadorService.excluirDoador).mockRejectedValue(
        new Error('Não é possível excluir: já há lançamentos ligados a este doador.'),
      )

      let excluiu = true
      await act(async () => {
        excluiu = await result.current.excluir('d1')
      })

      expect(excluiu).toBe(false)
      expect(result.current.error).toBe('Não é possível excluir: já há lançamentos ligados a este doador.')
      expect(result.current.doadores).toEqual([maria, jose, padaria])
    })
  })
})
