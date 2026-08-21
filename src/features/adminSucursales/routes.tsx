import { Settings, Store } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const adminSucursalesRoutes: AppRoute[] = [
  {
    path: 'administracion',
    meta: {
      name: 'Administración',
      description: 'Gestión del sistema',
      icon: Settings,
    },
    children: [
      {
        path: 'sucursales',
        meta: {
          name: 'Sucursales',
          description: 'Gestión de sucursales',
          icon: Store,
          permissions: ['admin'],
          lazy: () => import('./pages/SucursalesPage'),
        },
      },
      {
        path: 'sucursales/:id',
        meta: {
          name: 'Equipo de la sucursal',
          description: 'Usuarios asignados a la sucursal',
          permissions: ['admin'],
          hideFromSidebar: true,
          lazy: () => import('./pages/SucursalDetallePage'),
        },
      },
    ],
  },
]
