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
          agentHint: 'Articulos = productos del catalogo: listar productos con sus tallas y precio base, buscar, crear, editar, eliminar; ir a sus precios.',
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
          agentHint: 'Stock (existencias) por sucursal: elegir sucursal y ver o editar cantidades por producto y talla (borrador; el usuario guarda).',
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
          agentHint: 'Precios por sucursal: precio por producto y talla, restablecer precio, mayoreo y descuentos (borradores; el usuario guarda).',
          lazy: () => import('./pages/PreciosPage'),
        },
      },
    ],
  },
]
