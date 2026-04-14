import type { AppRoute } from '@/lib/app-routes'
import LoginPage from './pages/LoginPage'

export const authRoutes: AppRoute[] = [
  {
    path: '/login',
    element: < LoginPage />,
    meta: {
      name: 'Login',
      hideFromSidebar: true,
    },
  },
]
