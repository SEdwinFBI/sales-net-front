import { createBrowserRouter, type RouteObject } from 'react-router'
import MainLayout from '@/layouts/main/MainLayout'
import RedirectIndex from '@/components/route/RedirectIndex'
import { buildReactRoutes } from '@/lib/app-routes'
import { authRoutes } from '@/features/auth'
import { coreRoutes, ErrorPage } from '@/features/core'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'

import { clientesRoutes } from '@/features/customers'
import { inventarioRoutes } from '@/features/inventario'
import { reportingRoutes } from '@/features/reporting'
import { adminRoutes } from '@/features/admin'
import { cashRoutes } from '@/features/cash'

const mainLayoutRoutes: RouteObject = {
  path: '/',
  element: <MainLayout />,
  errorElement: <ErrorPage />,
  children: [
    {
      index: true,
      element: <RedirectIndex />,
    },
    {
      // Vista contextual: no se publica como entrada de sidebar ni como ruta del agente.
      path: 'reportes/configurar-pdf',
      lazy: async () => ({ Component: (await import('@/features/reporting/pages/PdfWorkspacePage')).default }),
    },
    ...buildReactRoutes([...adminRoutes, ...clientesRoutes, ...reportingRoutes, ...salesRoutes, ...cashRoutes, ...catalogRoutes, ...inventarioRoutes]),
  ],
}

export const router = createBrowserRouter([
  ...buildReactRoutes(authRoutes),
  ...buildReactRoutes(coreRoutes),
  mainLayoutRoutes,
])
