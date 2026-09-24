import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import * as authService from '../services/authService'
import * as lancamentosService from '../services/lancamentosService'
import type { Lancamento } from '../types/lancamento'
import { Dashboard } from './Dashboard'

vi.mock('../services/authService')
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
    comprovanteUrl: 'abc.pdf',
    cancelado: false,
    ...overrides,
  }
}

async function renderDashboard(lancamentos: Lancamento[] = []) {
  vi.mocked(lancamentosService.listLancamentos).mockResolvedValue(lancamentos)
  render(
    <MemoryRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>,
  )
  // Os cards só aparecem depois que o resumo carrega.
  await screen.findByText('Saldo em caixa')
}

function destinoDe(nome: RegExp) {
  return screen.getByRole('link', { name: nome }).getAttribute('href')
}

describe('Dashboard: cada card leva para uma tela', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.getSession).mockResolvedValue(null)
    vi.mocked(authService.onAuthStateChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
    // Fixa "hoje" em setembro/2026 para os links do mês atual serem previsíveis.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 24))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('saldo em caixa leva à lista completa de lançamentos', async () => {
    await renderDashboard()

    expect(destinoDe(/Saldo em caixa/)).toBe('/lancamentos')
  })

  it('entradas e saídas do mês levam a Lançamentos já filtrados pelo tipo e pelo mês atual', async () => {
    await renderDashboard()

    expect(destinoDe(/Entradas do mês/)).toBe('/lancamentos?tipo=entrada&mes=2026-09')
    expect(destinoDe(/Saídas do mês/)).toBe('/lancamentos?tipo=saida&mes=2026-09')
  })

  it('doações do mês levam às entradas do mês atual', async () => {
    await renderDashboard()

    expect(destinoDe(/Doações do mês/)).toBe('/lancamentos?tipo=entrada&mes=2026-09')
  })

  it('"Para onde foi o dinheiro" leva ao relatório do mês atual', async () => {
    await renderDashboard()

    expect(destinoDe(/Para onde foi o dinheiro/)).toBe('/relatorios?periodo=2026-09')
  })

  it('"Prestação de contas" leva aos lançamentos sem comprovante quando há pendências', async () => {
    await renderDashboard([lancamento({ comprovanteUrl: null })])

    expect(destinoDe(/Prestação de contas/)).toBe('/lancamentos?comprovante=faltando')
  })

  it('"Prestação de contas" leva à lista comum quando não há pendências (filtro daria lista vazia)', async () => {
    await renderDashboard([lancamento({ comprovanteUrl: 'abc.pdf' })])

    expect(destinoDe(/Prestação de contas/)).toBe('/lancamentos')
  })

  it('ações rápidas abrem o formulário certo em vez de ficarem desabilitadas', async () => {
    await renderDashboard()

    expect(destinoDe(/Nova entrada/)).toBe('/lancamentos?novo=entrada')
    expect(destinoDe(/Nova saída/)).toBe('/lancamentos?novo=saida')
    expect(destinoDe(/Novo doador/)).toBe('/doadores')
    expect(destinoDe(/Exportar/)).toBe('/relatorios')
    expect(screen.queryByRole('button', { name: /Nova entrada/ })).toBeNull()
  })

  it('doações recentes levam a Doadores e últimos lançamentos levam a Lançamentos', async () => {
    await renderDashboard()

    expect(destinoDe(/Doações recentes/)).toBe('/doadores')
    expect(destinoDe(/Últimos lançamentos/)).toBe('/lancamentos')
  })
})
