import { Settings, Users } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const adminUsuariosRoutes: AppRoute[] = [
  {
    path: 'administracion',
    meta: {
      name: 'Administración',
      description: 'Gestión del sistema',
      icon: Settings,
    },
    children: [
      {
        path: 'usuarios',
        meta: {
          name: 'Usuarios',
          description: 'Gestión de usuarios',
          icon: Users,
          permissions: ['admin'],
          lazy: () => import('./pages/UsuariosPage'),
        },
      },
    ],
  },
]
