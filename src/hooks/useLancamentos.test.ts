import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { irParaEndereco } from '../lib/navegador'
import * as comprovanteService from '../services/comprovanteService'
import * as lancamentosService from '../services/lancamentosService'
import type { Categoria } from '../types/categoria'
import type { Lancamento } from '../types/lancamento'
import { useLancamentos, type FiltroLancamentos } from './useLancamentos'
import type { FormularioLancamento } from './validarLancamento'

vi.mock('../services/lancamentosService')
vi.mock('../services/comprovanteService')
vi.mock('../lib/navegador')

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
    // O valor padrão (150,50) exige comprovante; o formulário-base já vem com um anexado.
    arquivo: null,
    comprovanteAtual: 'existente.pdf',
    ...overrides,
  }
}

function comprovante() {
  return new File(['x'], 'nota.pdf', { type: 'application/pdf' })
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
        comprovanteUrl: 'existente.pdf',
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
        comprovanteUrl: 'existente.pdf',
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

  describe('excluir', () => {
    it('exclui o lançamento cancelado e ele some da lista', async () => {
      const { result } = await renderCarregado([lancamento({ id: 'l1', cancelado: true })])
      vi.mocked(lancamentosService.excluirLancamento).mockResolvedValue(undefined)
      vi.mocked(lancamentosService.listLancamentos).mockResolvedValue([])

      let excluiu = false
      await act(async () => {
        excluiu = await result.current.excluir('l1')
      })

      expect(excluiu).toBe(true)
      expect(lancamentosService.excluirLancamento).toHaveBeenCalledWith('l1')
      expect(result.current.lancamentos).toEqual([])
    })

    it('mostra a orientação do service e mantém a lista quando não pode excluir', async () => {
      const { result } = await renderCarregado([lancamento({ id: 'l1' })])
      vi.mocked(lancamentosService.excluirLancamento).mockRejectedValue(
        new Error('Só é possível excluir um lançamento que já foi cancelado.'),
      )

      let excluiu = true
      await act(async () => {
        excluiu = await result.current.excluir('l1')
      })

      expect(excluiu).toBe(false)
      expect(result.current.error).toBe('Só é possível excluir um lançamento que já foi cancelado.')
      expect(result.current.lancamentos).toHaveLength(1)
    })
  })

  describe('comprovante', () => {
    it('envia o arquivo antes de salvar e grava o caminho devolvido no lançamento', async () => {
      const { result } = await renderCarregado([])
      const chamadas: string[] = []
      vi.mocked(comprovanteService.enviarComprovante).mockImplementation(async () => {
        chamadas.push('enviar')
        return 'novo-caminho.pdf'
      })
      vi.mocked(lancamentosService.criarLancamento).mockImplementation(async () => {
        chamadas.push('salvar')
      })
      const nota = comprovante()

      await act(async () => {
        await result.current.criar(formulario({ arquivo: nota, comprovanteAtual: null }))
      })

      expect(comprovanteService.enviarComprovante).toHaveBeenCalledWith(nota)
      expect(lancamentosService.criarLancamento).toHaveBeenCalledWith(
        expect.objectContaining({ comprovanteUrl: 'novo-caminho.pdf' }),
      )
      expect(chamadas).toEqual(['enviar', 'salvar'])
    })

    it('não envia arquivo quando não há um novo, mantendo o caminho que o lançamento já tinha', async () => {
      const { result } = await renderCarregado()
      vi.mocked(lancamentosService.editarLancamento).mockResolvedValue(undefined)

      await act(async () => {
        await result.current.editar('l1', formulario({ arquivo: null, comprovanteAtual: 'antigo.pdf' }))
      })

      expect(comprovanteService.enviarComprovante).not.toHaveBeenCalled()
      expect(lancamentosService.editarLancamento).toHaveBeenCalledWith(
        'l1',
        expect.objectContaining({ comprovanteUrl: 'antigo.pdf' }),
      )
    })

    it('substitui o comprovante: envia o novo arquivo e grava o novo caminho', async () => {
      const { result } = await renderCarregado()
      vi.mocked(comprovanteService.enviarComprovante).mockResolvedValue('substituto.pdf')
      vi.mocked(lancamentosService.editarLancamento).mockResolvedValue(undefined)

      await act(async () => {
        await result.current.editar('l1', formulario({ arquivo: comprovante(), comprovanteAtual: 'antigo.pdf' }))
      })

      expect(lancamentosService.editarLancamento).toHaveBeenCalledWith(
        'l1',
        expect.objectContaining({ comprovanteUrl: 'substituto.pdf' }),
      )
    })

    it('não salva o lançamento quando o envio do arquivo falha', async () => {
      const { result } = await renderCarregado([])
      vi.mocked(comprovanteService.enviarComprovante).mockRejectedValue(
        new Error('Não foi possível enviar o comprovante'),
      )

      let criou = true
      await act(async () => {
        criou = await result.current.criar(formulario({ arquivo: comprovante(), comprovanteAtual: null }))
      })

      expect(criou).toBe(false)
      expect(result.current.error).toBe('Não foi possível enviar o comprovante')
      expect(lancamentosService.criarLancamento).not.toHaveBeenCalled()
    })

    it('mostra o erro de validação e não envia o arquivo quando o valor exige comprovante e falta', async () => {
      const { result } = await renderCarregado([])

      await act(async () => {
        await result.current.criar(formulario({ arquivo: null, comprovanteAtual: null }))
      })

      expect(result.current.error).toMatch(/^Anexe o comprovante/)
      expect(comprovanteService.enviarComprovante).not.toHaveBeenCalled()
      expect(lancamentosService.criarLancamento).not.toHaveBeenCalled()
    })

    it('repassa o filtro "sem comprovante" para a listagem', async () => {
      await renderCarregado([], { semComprovante: true })

      expect(lancamentosService.listLancamentos).toHaveBeenCalledWith({ semComprovante: true })
    })
  })

  describe('abrirComprovante', () => {
    it.each(['abc.jpg', 'abc.png', 'abc.webp'])('foto (%s): expõe o link para abrir num modal, sem sair da tela', async (caminho) => {
      const { result } = await renderCarregado()
      vi.mocked(comprovanteService.gerarLinkComprovante).mockResolvedValue('https://exemplo.com/foto')

      await act(async () => {
        await result.current.abrirComprovante(caminho)
      })

      expect(comprovanteService.gerarLinkComprovante).toHaveBeenCalledWith(caminho)
      expect(result.current.comprovanteAberto).toBe('https://exemplo.com/foto')
      expect(irParaEndereco).not.toHaveBeenCalled()
    })

    it('PDF: leva a própria aba para o link, sem abrir modal', async () => {
      const { result } = await renderCarregado()
      vi.mocked(comprovanteService.gerarLinkComprovante).mockResolvedValue('https://exemplo.com/nota')

      await act(async () => {
        await result.current.abrirComprovante('abc.pdf')
      })

      expect(irParaEndereco).toHaveBeenCalledWith('https://exemplo.com/nota')
      expect(result.current.comprovanteAberto).toBeNull()
    })

    it('fecharComprovante esconde o modal', async () => {
      const { result } = await renderCarregado()
      vi.mocked(comprovanteService.gerarLinkComprovante).mockResolvedValue('https://exemplo.com/foto')
      await act(async () => {
        await result.current.abrirComprovante('abc.jpg')
      })

      act(() => result.current.fecharComprovante())

      expect(result.current.comprovanteAberto).toBeNull()
    })

    it('mostra erro genérico e não abre nada quando não consegue gerar o link', async () => {
      const { result } = await renderCarregado()
      vi.mocked(comprovanteService.gerarLinkComprovante).mockRejectedValue(
        new Error('Não foi possível abrir o comprovante'),
      )

      await act(async () => {
        await result.current.abrirComprovante('abc.pdf')
      })

      expect(result.current.error).toBe('Não foi possível abrir o comprovante')
      expect(result.current.comprovanteAberto).toBeNull()
      expect(irParaEndereco).not.toHaveBeenCalled()
    })
  })
})
