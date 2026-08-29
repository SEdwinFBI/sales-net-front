import { adminUsuariosRoutes } from '@/features/adminUsuarios'
import { adminSucursalesRoutes } from '@/features/adminSucursales'
import { adminNotificacionesRoute } from '@/features/adminNotificaciones'
import type { AppRoute } from '@/lib/app-routes'


export const administracionRoute: AppRoute = {
  ...adminUsuariosRoutes[0],
  children: [
    ...(adminSucursalesRoutes[0].children ?? []),
    ...(adminUsuariosRoutes[0].children ?? []),
    adminNotificacionesRoute,
  ],
}
