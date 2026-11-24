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
          agentHint: 'Movimientos de inventario (entradas, salidas, ajustes): filtrar por fechas, tipo y sucursal, leer y descargar el PDF.',
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
          agentHint: 'Movimientos de stock (mercaderia) de cada vendedor/usuario: filtrar y leer, y descargar el PDF. No son ventas ni cobros.',
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
          agentHint: 'Resumen de existencias (lo que habia, hay y se vendio): filtrar por sucursal y cliente, leer y descargar el PDF.',
          lazy: () => import('./pages/ResumenExistenciasPage'),
        },
      },
    ],
  },
]
