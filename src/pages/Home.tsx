import { signOut } from '../services/authService'

export function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Lar Beneficente Cisco de Luz</h1>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Sair
      </button>
    </div>
  )
}
