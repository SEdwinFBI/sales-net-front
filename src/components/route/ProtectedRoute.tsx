import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { isTokenExpired, useAuthStore } from '@/features/core/store/auth-store'
import type { AppRole } from '@/features/auth/types/auth'

type ProtectedRouteProps = PropsWithChildren<{
  allowedPermissions: AppRole[]
}>

export default function ProtectedRoute({ allowedPermissions, children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)
  const location = useLocation()

  if (!user || !token || isTokenExpired(tokenExpiresAt)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }


  const hasAccess = user.permissions.some((p) => allowedPermissions.includes(p))

  if (!hasAccess) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children ?? <Outlet />
}
