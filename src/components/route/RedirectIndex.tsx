import { Navigate } from 'react-router'
import { isTokenExpired, useAuthStore } from '@/features/core/store/auth-store'
import { getHomeRoute } from '@/lib/app-routes'


/**
 * RedirectIndex - Redirige al HOME del usuario según su rol.

 */
export default function RedirectIndex() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const refreshExpiresAt = useAuthStore((state) => state.refreshExpiresAt)

  // Solo expulsa si el REFRESH expiró; un access vencido se renueva solo.
  if (!user || !token || isTokenExpired(refreshExpiresAt)) {
    return <Navigate to="/login" replace />
  }


  return <Navigate to={getHomeRoute(user.role)} replace />
}
