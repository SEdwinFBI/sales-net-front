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
          agentHint: 'Movimientos de inventario: filtrar por fechas, tipo y sucursal, leer movimientos y descargar el PDF.',
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
          agentHint: 'Movimientos por vendedor: filtrar y leer los movimientos de stock de cada vendedor y descargar el PDF.',
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
          agentHint: 'Resumen de existencias: filtrar por sucursal y cliente, leer el resumen y descargar el PDF (con o sin detalle).',
          lazy: () => import('./pages/ResumenExistenciasPage'),
        },
      },
    ],
  },
]
