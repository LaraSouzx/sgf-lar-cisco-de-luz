import type { FormEvent } from 'react'
import { useLogin } from '../hooks/useLogin'

export function Login() {
  const { email, setEmail, password, setPassword, isLoading, error, login } = useLogin()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login()
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:w-1/2 flex-col justify-center bg-gradient-to-br from-blue-500 to-blue-300 p-12 text-white">
        <h1 className="text-4xl font-semibold">Lar Beneficente Cisco de Luz</h1>
        <p className="mt-4 text-blue-50">Gestão financeira simples e transparente.</p>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Entrar</h2>

          <label className="mt-6 block text-sm font-medium text-gray-700" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />

          <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
