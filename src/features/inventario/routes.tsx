import { ArrowLeftRight, ClipboardList, Users, Warehouse } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const inventarioRoutes: AppRoute[] = [
  {
    path: 'inventario',
    meta: {
      name: 'Inventario',
      description: 'Movimientos y existencias',
      icon: Warehouse,
    },
    children: [
      {
        path: 'movimientos',
        meta: {
          name: 'Movimientos',
          description: 'Entradas y salidas de existencias',
          icon: ArrowLeftRight,
          permissions: ['admin'],
          lazy: () => import('./pages/MovimientosStockPage'),
        },
      },
      {
        path: 'por-vendedor',
        meta: {
          name: 'Por vendedor',
          description: 'Disminuciones y resurtidos de cada vendedor',
          icon: Users,
          permissions: ['admin'],
          lazy: () => import('./pages/MovimientosPorVendedorPage'),
        },
      },
      {
        path: 'resumen',
        meta: {
          name: 'Resumen de existencias',
          description: 'Lo que había, lo que hay y lo que se vendió',
          icon: ClipboardList,
          permissions: ['admin'],
          lazy: () => import('./pages/ResumenExistenciasPage'),
        },
      },
    ],
  },
]
