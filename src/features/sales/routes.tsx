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
  {
    path: 'punto-de-venta2',
    meta: {
      name: 'Punto de venta2',
      description: 'Venta de productos',
      icon: Store,
      permissions: ['vendedor'],
      lazy: () => import('./pages/PosPage'),
    },
  },
  {
    path: 'venta2',
    meta: {
      name: 'Venta2',
      description: 'Operacion de ventas',
      icon: Store,
    },
    children: [
      {
        path: 'punto-de-venta3',
        meta: {
          name: 'Punto de venta3',
          description: 'Venta de productos',
          icon: Store,
          permissions: ['vendedor'],
          lazy: () => import('./pages/PosPage'),

        },
        children: [
          {
            path: 'punto-de-venta3',
            meta: {
              name: 'Punto de venta3',
              description: 'Venta de productos',
              icon: Store,
              permissions: ['vendedor'],
              lazy: () => import('./pages/PosPage'),
            },
          },
        ],
      },
      {
        path: 'punto-de-venta5',
        meta: {
          name: 'Punto de venta3',
          description: 'Venta de productos',
          icon: Store,
          permissions: ['vendedor'],
          lazy: () => import('./pages/PosPage'),

        },
        children: [
          {
            path: 'punto-de-venta3',
            meta: {
              name: 'Punto de venta3',
              description: 'Venta de productos',
              icon: Store,
              permissions: ['vendedor'],
              lazy: () => import('./pages/PosPage'),
            },
          },
        ],
      },
    ],
  },
]
