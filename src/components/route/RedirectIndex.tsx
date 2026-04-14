import { Navigate } from 'react-router'
import { useAuthStore } from '@/store/auth-store'
import { getHomeRoute } from '@/lib/app-routes'


/**
 * RedirectIndex - Redirige al HOME del usuario según su rol.

 */
export default function RedirectIndex() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }


  return <Navigate to={getHomeRoute(user.role)} replace />
}
