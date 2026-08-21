import { adminUsuariosRoutes } from '@/features/adminUsuarios'
import { adminSucursalesRoutes } from '@/features/adminSucursales'
import type { AppRoute } from '@/lib/app-routes'

/**
 * `adminUsuariosRoutes` y `adminSucursalesRoutes` declaran, cada uno por su
 * cuenta, el mismo nodo padre `administracion` (mismo patrón que ya usaba
 * "Usuarios"). Se fusionan en un solo nodo AQUÍ, en un único lugar, para que
 * el router (src/routes/routes.tsx) y el sidebar (MainLayout.tsx) nunca vean
 * dos secciones "Administración" ni queden desincronizados entre sí.
 */
export const administracionRoute: AppRoute = {
  ...adminUsuariosRoutes[0],
  children: [
    ...(adminUsuariosRoutes[0].children ?? []),
    ...(adminSucursalesRoutes[0].children ?? []),
  ],
}
