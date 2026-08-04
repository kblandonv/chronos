import type { ReactNode } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return <div className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">Cargando...</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
