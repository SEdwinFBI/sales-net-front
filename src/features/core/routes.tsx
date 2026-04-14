import type { AppRoute } from '@/lib/app-routes'
import ErrorPage from './pages/ErrorPage'
import UnauthorizePage from './pages/UnauthorizePage'

export const coreRoutes: AppRoute[] = [
  {
    path: '/acceso-denegado',
    element: <UnauthorizePage />,
    meta: { name: 'Acceso denegado', hideFromSidebar: true },
  },
  {
    path: '/error',
    element: <ErrorPage />,
    meta: { name: 'Error', hideFromSidebar: true },
  },
]

