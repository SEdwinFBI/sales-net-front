import { Navigate } from 'react-router'
import { isTokenExpired, useAuthStore } from '@/features/core/store/auth-store'
import { getHomeRoute } from '@/lib/app-routes'


/**
 * RedirectIndex - Redirige al HOME del usuario según su rol.

 */
export default function RedirectIndex() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)

  if (!user || !token || isTokenExpired(tokenExpiresAt)) {
    return <Navigate to="/login" replace />
  }


  return <Navigate to={getHomeRoute(user.role)} replace />
}
