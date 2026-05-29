import { Users } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const clientesRoutes: AppRoute[] = [
  {
    path: 'clientes',
    meta: {
      name: 'Clientes',
      description: 'Gestión de clientes',
      icon: Users,
    },
    children: [
      {
        path: 'listado',
        meta: {
          name: 'Lista de clientes',
          description: 'Ver y gestionar clientes',
          icon: Users,
          permissions: ['admin', 'vendedor'],
          lazy: () => import('./pages/ClientesPage'),
        },
      },
      {
        path: 'listado/:id',
        meta: {
          name: 'Detalle del cliente',
          description: 'Información del cliente',
          icon: Users,
          permissions: ['admin', 'vendedor'],
          lazy: () => import('./pages/ClienteDetailPage'),
          hideFromSidebar: true,
        },
      },
    ],
  },
]
