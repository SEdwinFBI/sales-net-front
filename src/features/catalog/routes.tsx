import { Boxes, Package, Tags } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const catalogRoutes: AppRoute[] = [
  {
    path: 'catalogo',
    meta: {
      name: 'Catalogo',
      description: 'Opciones de catalogo',
      icon: Package,
    },
    children: [
      {
        path: 'productos',
        meta: {
          name: 'Articulos',
          description: 'Configuracion de articulos',
          icon: Package,
          permissions: ['admin'],
          lazy: () => import('./pages/ProductsList'),
        },
      },
      {
        path: 'stock',
        meta: {
          name: 'Stock',
          description: 'Gestion de stock por vendedor',
          icon: Boxes,
          permissions: ['admin'],
          lazy: () => import('./pages/StockPage'),
        },
      },
      {
        path: 'precios',
        meta: {
          name: 'Precios y descuentos',
          description: 'Precios y reglas de descuento por usuario',
          icon: Tags,
          permissions: ['admin'],
          lazy: () => import('./pages/PreciosPage'),
        },
      },
    ],
  },
]
