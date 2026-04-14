import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/store/auth-store'
import type { AppRole } from '@/store/auth-store'

type ProtectedRouteProps = PropsWithChildren<{
  allowedPermissions: AppRole[]
}>

export default function ProtectedRoute({ allowedPermissions, children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }


  const hasAccess = user.permissions.some((p) => allowedPermissions.includes(p))

  if (!hasAccess) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children ?? <Outlet />
}
