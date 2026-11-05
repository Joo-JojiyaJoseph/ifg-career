import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '@shared/ui/Skeleton'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <Skeleton className="m-6 h-40" />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
