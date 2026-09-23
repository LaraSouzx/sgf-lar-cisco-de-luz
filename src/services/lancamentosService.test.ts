import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listLancamentos } from './lancamentosService'

const { order, lte, gte, select, from } = vi.hoisted(() => {
  const order = vi.fn()
  const lte = vi.fn(() => ({ order }))
  const gte = vi.fn(() => ({ lte, order }))
  const select = vi.fn(() => ({ gte, lte, order }))
  const from = vi.fn((_table: string) => ({ select }))
  return { order, lte, gte, select, from }
})

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from },
}))

describe('lancamentosService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listLancamentos', () => {
    it('busca na tabela lancamentos com os relacionamentos de categoria e doador', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({})

      expect(from).toHaveBeenCalledWith('lancamentos')
      expect(select).toHaveBeenCalledWith(
        expect.stringContaining('categorias'),
      )
    })

    it('filtra por período quando dataInicio e dataFim são informados', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({ dataInicio: '2026-09-01', dataFim: '2026-09-30' })

      expect(gte).toHaveBeenCalledWith('data', '2026-09-01')
      expect(lte).toHaveBeenCalledWith('data', '2026-09-30')
    })

    it('converte as linhas do banco para o formato do domínio', async () => {
      order.mockResolvedValue({
        data: [
          {
            id: 'l1',
            data: '2026-09-20',
            valor: 150,
            tipo: 'entrada',
            categoria_id: 'c1',
            categorias: { nome: 'Doações' },
            usuario_id: 'u1',
            doador_id: 'd1',
            doadores: { nome: 'Maria' },
            descricao: 'Doação mensal',
            comprovante_url: null,
            cancelado: false,
          },
        ],
        error: null,
      })

      const result = await listLancamentos({})

      expect(result).toEqual([
        {
          id: 'l1',
          data: '2026-09-20',
          valor: 150,
          tipo: 'entrada',
          categoriaId: 'c1',
          categoriaNome: 'Doações',
          usuarioId: 'u1',
          doadorId: 'd1',
          doadorNome: 'Maria',
          descricao: 'Doação mensal',
          comprovanteUrl: null,
          cancelado: false,
        },
      ])
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      order.mockResolvedValue({ data: null, error: { message: 'db error' } })

      await expect(listLancamentos({})).rejects.toThrow('Não foi possível carregar os lançamentos')
    })
  })
})
