import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden shrink-0 flex-col justify-start gap-16 bg-[linear-gradient(180deg,rgba(8,18,40,0.78)_0%,rgba(8,18,40,0.55)_30%,rgba(8,18,40,0)_58%),url('/login-hero.png')] bg-cover bg-bottom p-12 text-white md:flex md:w-1/2">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 self-start rounded-full border border-white/35 bg-[rgba(8,18,40,0.55)] px-4 py-2.5 text-sm font-semibold">
            <span>Bom te ver de novo</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
            </svg>
          </div>
          <h1 className="m-0 text-[54px] leading-[1.05] font-bold tracking-[-0.03em] [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]">
            Lar Beneficente Cisco de Luz
          </h1>
          <p className="m-0 text-[17px] text-white">Gestão financeira simples e transparente.</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-12">
        <div className="mb-8 text-center md:hidden">
          <h1 className="text-2xl font-semibold text-gray-900">Lar Beneficente Cisco de Luz</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão financeira simples e transparente.</p>
        </div>

        {children}
      </div>
    </div>
  )
}
