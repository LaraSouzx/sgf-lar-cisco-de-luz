import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as categoriaService from '../services/categoriaService'
import type { Categoria } from '../types/categoria'
import { useCategorias } from './useCategorias'

vi.mock('../services/categoriaService')

const aluguel: Categoria = { id: 'c1', nome: 'Aluguel', tipo: 'saida', ativa: true }
const doacao: Categoria = { id: 'c2', nome: 'Doação', tipo: 'entrada', ativa: true }

async function renderCarregado(categorias: Categoria[] = [aluguel, doacao]) {
  vi.mocked(categoriaService.listarCategorias).mockResolvedValue(categorias)
  const hook = renderHook(() => useCategorias())
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

describe('useCategorias', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('carregamento', () => {
    it('expõe isLoading: true antes das categorias carregarem', () => {
      vi.mocked(categoriaService.listarCategorias).mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useCategorias())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.categorias).toEqual([])
    })

    it('carrega as categorias via categoriaService', async () => {
      const { result } = await renderCarregado()

      expect(result.current.categorias).toEqual([aluguel, doacao])
      expect(result.current.error).toBeNull()
    })

    it('expõe mensagem de erro genérica quando o carregamento falha', async () => {
      vi.mocked(categoriaService.listarCategorias).mockRejectedValue(
        new Error('Não foi possível carregar as categorias'),
      )

      const { result } = renderHook(() => useCategorias())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Não foi possível carregar as categorias')
    })
  })

  describe('criar', () => {
    it('cria a categoria com o nome sem espaços nas pontas e recarrega a lista', async () => {
      const { result } = await renderCarregado([aluguel])
      const luz: Categoria = { id: 'c3', nome: 'Luz', tipo: 'saida', ativa: true }
      vi.mocked(categoriaService.criarCategoria).mockResolvedValue(undefined)
      vi.mocked(categoriaService.listarCategorias).mockResolvedValue([aluguel, luz])

      let criou = false
      await act(async () => {
        criou = await result.current.criar('  Luz ', 'saida')
      })

      expect(criou).toBe(true)
      expect(categoriaService.criarCategoria).toHaveBeenCalledWith({ nome: 'Luz', tipo: 'saida' })
      expect(result.current.categorias).toEqual([aluguel, luz])
      expect(result.current.error).toBeNull()
    })

    it('bloqueia nome repetido (ignorando maiúsculas) antes de chamar o service', async () => {
      const { result } = await renderCarregado()

      let criou = true
      await act(async () => {
        criou = await result.current.criar('aluguel', 'saida')
      })

      expect(criou).toBe(false)
      expect(result.current.error).toBe('Já existe uma categoria com esse nome')
      expect(categoriaService.criarCategoria).not.toHaveBeenCalled()
    })

    it('bloqueia nome vazio antes de chamar o service', async () => {
      const { result } = await renderCarregado()

      await act(async () => {
        await result.current.criar('   ', 'entrada')
      })

      expect(result.current.error).toBe('Informe o nome da categoria')
      expect(categoriaService.criarCategoria).not.toHaveBeenCalled()
    })

    it('expõe a mensagem do service quando salvar falha', async () => {
      const { result } = await renderCarregado()
      vi.mocked(categoriaService.criarCategoria).mockRejectedValue(
        new Error('Não foi possível salvar a categoria'),
      )

      let criou = true
      await act(async () => {
        criou = await result.current.criar('Luz', 'saida')
      })

      expect(criou).toBe(false)
      expect(result.current.error).toBe('Não foi possível salvar a categoria')
    })
  })

  describe('editar', () => {
    it('renomeia a categoria e recarrega a lista', async () => {
      const { result } = await renderCarregado()
      const renomeada = { ...aluguel, nome: 'Aluguel da sede' }
      vi.mocked(categoriaService.editarCategoria).mockResolvedValue(undefined)
      vi.mocked(categoriaService.listarCategorias).mockResolvedValue([renomeada, doacao])

      let editou = false
      await act(async () => {
        editou = await result.current.editar('c1', ' Aluguel da sede ')
      })

      expect(editou).toBe(true)
      expect(categoriaService.editarCategoria).toHaveBeenCalledWith('c1', { nome: 'Aluguel da sede' })
      expect(result.current.categorias).toEqual([renomeada, doacao])
    })

    it('bloqueia renomear para o nome de outra categoria', async () => {
      const { result } = await renderCarregado()

      await act(async () => {
        await result.current.editar('c1', 'Doação')
      })

      expect(result.current.error).toBe('Já existe uma categoria com esse nome')
      expect(categoriaService.editarCategoria).not.toHaveBeenCalled()
    })

    it('permite salvar com o mesmo nome que a própria categoria já tem (só muda maiúsculas)', async () => {
      const { result } = await renderCarregado()
      vi.mocked(categoriaService.editarCategoria).mockResolvedValue(undefined)

      await act(async () => {
        await result.current.editar('c1', 'ALUGUEL')
      })

      expect(result.current.error).toBeNull()
      expect(categoriaService.editarCategoria).toHaveBeenCalledWith('c1', { nome: 'ALUGUEL' })
    })
  })

  describe('desativar', () => {
    it('desativa a categoria e ela continua na lista, marcada como inativa', async () => {
      const { result } = await renderCarregado()
      vi.mocked(categoriaService.desativarCategoria).mockResolvedValue(undefined)
      vi.mocked(categoriaService.listarCategorias).mockResolvedValue([
        { ...aluguel, ativa: false },
        doacao,
      ])

      await act(async () => {
        await result.current.desativar('c1')
      })

      expect(categoriaService.desativarCategoria).toHaveBeenCalledWith('c1')
      expect(result.current.categorias).toHaveLength(2)
      expect(result.current.categorias.find((categoria) => categoria.id === 'c1')?.ativa).toBe(false)
    })

    it('expõe a mensagem do service quando desativar falha', async () => {
      const { result } = await renderCarregado()
      vi.mocked(categoriaService.desativarCategoria).mockRejectedValue(
        new Error('Não foi possível salvar a categoria'),
      )

      await act(async () => {
        await result.current.desativar('c1')
      })

      expect(result.current.error).toBe('Não foi possível salvar a categoria')
    })
  })
})
