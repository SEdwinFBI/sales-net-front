import { BarChart3 } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const reportingRoutes: AppRoute[] = [
  {
    path: 'reportes',
    meta: {
      name: 'Reportes',
      description: 'Reportes del sistema',
      icon: BarChart3,
    },
    children: [
      {
        path: 'ventas',
        meta: {
          name: 'Ventas',
          description: 'Reporte de ventas',
          permissions: ['admin', 'vendedor'],
          lazy: () => import('./pages/ReporteVentasPage'),
        },
      },
      {
        path: 'deudores',
        meta: {
          name: 'Deudores',
          description: 'Reporte de deudores',
          permissions: ['admin', 'vendedor'],
          lazy: () => import('./pages/ReporteDeudoresPage'),
        },
      },
    ],
  },
]
