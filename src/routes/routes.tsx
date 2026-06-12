import { createBrowserRouter, type RouteObject } from 'react-router'
import MainLayout from '@/layouts/main/MainLayout'
import RedirectIndex from '@/components/route/RedirectIndex'
import { buildReactRoutes } from '@/lib/app-routes'
import { authRoutes } from '@/features/auth'
import { coreRoutes, ErrorPage } from '@/features/core'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'


const mainLayoutRoutes: RouteObject = {
  path: '/',
  element: <MainLayout />,
  errorElement: <ErrorPage />,
  children: [
    {
      index: true,
      element: <RedirectIndex />,
    },
    ...buildReactRoutes([...salesRoutes, ...catalogRoutes]),
  ],
}

export const router = createBrowserRouter([
  ...buildReactRoutes(authRoutes),
  ...buildReactRoutes(coreRoutes),
  mainLayoutRoutes,
])
