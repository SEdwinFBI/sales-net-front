import { Store } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const salesRoutes: AppRoute[] = [
  {
    path: 'venta',
    meta: {
      name: 'Venta',
      description: 'Operacion de ventas',
      icon: Store,
    },
    children: [
      {
        path: 'punto-de-venta',
        meta: {
          name: 'Punto de venta',
          description: 'Venta de productos',
          icon: Store,
          permissions: ['vendedor'],
          agentHint: 'Punto de venta: HACER una venta. Carrito: buscar y agregar productos, elegir o crear cliente, existencias en otras sucursales, cobrar la venta.',
          lazy: () => import('./pages/PosPage'),
        },
      },
      {
        path: 'historial',
        meta: {
          name: 'Historial',
          description: 'Historial de ventas',
          icon: Store,
          permissions: ['admin', 'vendedor'],
          agentHint: 'Historial: CONSULTAR ventas ya hechas (ultimas, por fecha, cliente o vendedor), detalle, foto, anular y PDF. No registra ventas.',
          lazy: () => import('./pages/HistorialVentasPage'),
        },
      },
    ],
  },

]
