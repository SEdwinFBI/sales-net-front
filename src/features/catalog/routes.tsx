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
          agentHint: 'Articulos: buscar, crear, editar y eliminar articulos; ir a los precios de un articulo.',
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
          agentHint: 'Stock por sucursal: elegir una sucursal y editar el stock de sus variantes (borrador; el usuario guarda).',
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
          agentHint: 'Precios por sucursal: precio por variante, restablecer precio y rangos de mayoreo (borradores; el usuario guarda).',
          lazy: () => import('./pages/PreciosPage'),
        },
      },
    ],
  },
]
