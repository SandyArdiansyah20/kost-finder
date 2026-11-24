import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, isOwner, loading } = useAuth()
  if (loading) return <p className="p-8 text-center text-slate-500">Memuat…</p>
  if (!user) return <Navigate to="/login" replace />
  if (ownerOnly && !isOwner) return <Navigate to="/" replace />
  return children
}
