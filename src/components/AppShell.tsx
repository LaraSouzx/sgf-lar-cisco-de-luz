import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { signOut } from '../services/authService'

type NavItem = {
  label: string
  icon: ReactNode
  to?: string
}

const iconVisaoGeral = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
)
const iconLancamentos = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h13M7 12h13M7 17h13" />
    <circle cx="3.5" cy="7" r="0.5" />
    <circle cx="3.5" cy="12" r="0.5" />
    <circle cx="3.5" cy="17" r="0.5" />
  </svg>
)
const iconCategorias = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </svg>
)
const iconDoadores = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </svg>
)
const iconRelatorios = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
)
const iconConfiguracoes = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)
const iconAjuda = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" />
  </svg>
)
const iconSair = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />
  </svg>
)

const itensPrincipais: NavItem[] = [
  { label: 'Visão geral', icon: iconVisaoGeral, to: '/' },
  { label: 'Lançamentos', icon: iconLancamentos },
  { label: 'Categorias', icon: iconCategorias },
  { label: 'Doadores', icon: iconDoadores },
  { label: 'Relatórios', icon: iconRelatorios },
]

const itensOutros: NavItem[] = [
  { label: 'Configurações', icon: iconConfiguracoes },
  { label: 'Ajuda', icon: iconAjuda },
]

function ItemMenu({ item }: { item: NavItem }) {
  const location = useLocation()
  const classeBase =
    'flex items-center gap-3 h-11 px-3.5 rounded-[10px] text-sm font-medium no-underline'

  if (!item.to) {
    return (
      <span
        aria-disabled="true"
        className={`${classeBase} text-[#8b968a] cursor-not-allowed`}
        title="Ainda não disponível"
      >
        {item.icon}
        {item.label}
      </span>
    )
  }

  const ativo = location.pathname === item.to
  const classeAtivo = ativo ? 'bg-[#141a14] text-white font-semibold' : 'text-[#3c463a] hover:bg-[#e9eee6]'

  return (
    <Link to={item.to} aria-current={ativo ? 'page' : undefined} className={`${classeBase} ${classeAtivo}`}>
      {item.icon}
      {item.label}
    </Link>
  )
}

function nomeExibicao(email: string | undefined, nomeCompleto: unknown) {
  if (typeof nomeCompleto === 'string' && nomeCompleto.trim()) {
    return nomeCompleto
  }
  return email?.split('@')[0] ?? 'responsável'
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuthContext()
  const nome = nomeExibicao(session?.user.email, session?.user.user_metadata?.nome_completo)
  const inicial = nome.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#d9e0d5] p-4 md:p-8">
      <div className="flex w-full flex-col overflow-hidden rounded-[28px] bg-[#f4f7f1] md:flex-row">
        <nav
          aria-label="Menu principal"
          className="hidden w-[260px] shrink-0 flex-col gap-2 border-r border-[#e3e9df] bg-[#f4f7f1] p-[18px_18px_28px] md:flex"
        >
          <div className="flex items-center gap-2.5 px-2 pb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#141a14]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9fe39a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-bold tracking-[-0.01em]">Cisco de Luz</div>
              <div className="text-xs text-[#5d6a5a]">Gestão financeira</div>
            </div>
          </div>

          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.08em] text-[#5d6a5a]">
            PRINCIPAL
          </div>
          {itensPrincipais.map((item) => (
            <ItemMenu key={item.label} item={item} />
          ))}

          <div className="mx-2 my-3 h-px bg-[#e3e9df]" />
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-[#5d6a5a]">
            OUTROS
          </div>
          {itensOutros.map((item) => (
            <ItemMenu key={item.label} item={item} />
          ))}
          <button
            type="button"
            onClick={() => signOut()}
            className="flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-left text-sm font-medium text-[#3c463a] hover:bg-[#e9eee6]"
          >
            {iconSair}
            Sair
          </button>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#e3e9df] bg-[#f4f7f1] px-6 md:px-8">
            <div className="flex items-center gap-3.5">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#141a14] text-[17px] font-bold text-[#9fe39a]"
              >
                {inicial}
              </div>
              <div className="flex flex-col gap-0.5">
                <h1 className="m-0 text-[22px] font-semibold tracking-[-0.01em]">Olá, {nome}</h1>
                <div className="text-sm text-[#4f5c4c]">Este é o resumo das finanças do Lar hoje</div>
              </div>
            </div>
          </header>

          <div className="flex-1 bg-[#e9eee6] p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
