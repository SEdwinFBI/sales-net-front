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
          agentHint: 'Carrito: buscar y agregar articulos, elegir o crear cliente, ver existencias en otras sucursales y precios del cliente, abrir el cobro.',
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
          agentHint: 'Historial de ventas: filtrar, leer, ver detalle y foto, anular una venta (si tiene permiso) y descargar el PDF.',
          lazy: () => import('./pages/HistorialVentasPage'),
        },
      },
    ],
  },

]
