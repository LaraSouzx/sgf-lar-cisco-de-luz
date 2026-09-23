import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { useLogin } from '../hooks/useLogin'

export function Login() {
  const { email, setEmail, password, setPassword, isLoading, error, login } = useLogin()
  const { session } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login()
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden shrink-0 flex-col justify-start gap-16 bg-[linear-gradient(180deg,rgba(8,18,40,0.78)_0%,rgba(8,18,40,0.55)_30%,rgba(8,18,40,0)_58%),url('/login-hero.png')] bg-cover bg-bottom p-12 text-white md:flex md:w-[45%]">
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

        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5.5">
          <h2 className="m-0 mb-1.5 text-center text-4xl font-semibold tracking-[-0.02em] text-gray-900">
            Entrar
          </h2>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="email" className="text-sm font-semibold text-gray-900">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-[14px] border-none bg-[#f4f5f7] px-4 text-[15px] text-gray-900 focus:outline-2 focus:outline-[#1f45d6] focus:outline-offset-0"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="password" className="text-sm font-semibold text-gray-900">
              Senha
            </label>
            <div className="relative flex">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 grow rounded-[14px] border-none bg-[#f4f5f7] py-0 pr-13 pl-4 text-[15px] text-gray-900 focus:outline-2 focus:outline-[#1f45d6] focus:outline-offset-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute top-0.5 right-0.5 flex h-11 w-11 items-center justify-center text-[#6b7079]"
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.8 3.7M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <label className="flex min-h-8 items-center gap-2 text-[13px] text-gray-600">
                <input type="checkbox" className="m-0 h-4 w-4 accent-[#1f45d6]" />
                Lembrar de mim
              </label>
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="text-[13px] font-semibold text-[#1f45d6] hover:text-[#1532a6] hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 h-13.5 rounded-[14px] border-none bg-[#1f45d6] text-[17px] font-bold text-white hover:bg-[#1532a6] disabled:opacity-60"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
