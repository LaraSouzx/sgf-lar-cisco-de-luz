import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export function ProtectedRoute() {
  const { session, isLoading } = useAuthContext()

  if (isLoading) {
    return <p className="p-8 text-center text-gray-500">Carregando...</p>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
