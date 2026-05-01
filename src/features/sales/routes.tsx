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
          lazy: () => import('./pages/PosPage'),
        },
      },
    ],
  },

]
