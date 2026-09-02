import { Settings, Store, Users } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const adminRoutes: AppRoute[] = [
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
          lazy: () => import('./branches/pages/SucursalesPage'),
        },
      },
      {
        path: 'sucursales/:id',
        meta: {
          name: 'Equipo de la sucursal',
          description: 'Usuarios asignados a la sucursal',
          permissions: ['admin'],
          hideFromSidebar: true,
          lazy: () => import('./branches/pages/SucursalDetallePage'),
        },
      },
      {
        path: 'usuarios',
        meta: {
          name: 'Usuarios',
          description: 'Gestión de usuarios',
          icon: Users,
          permissions: ['admin'],
          lazy: () => import('./users/pages/UsuariosPage'),
        },
      },
      {
        path: 'notificaciones',
        meta: {
          name: 'Notificaciones',
          description: 'Destinatarios de notificaciones',
          permissions: ['admin'],
          hideFromSidebar: true,
          lazy: () => import('./notifications/pages/NotificacionesPage'),
        },
      },
    ],
  },
]
