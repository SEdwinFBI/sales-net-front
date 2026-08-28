import type { AppRoute } from '@/lib/app-routes'

export const adminNotificacionesRoute: AppRoute = {
  path: 'notificaciones',
  meta: {
    name: 'Notificaciones',
    description: 'Destinatarios de notificaciones',
    permissions: ['admin'],
    hideFromSidebar: true,
    lazy: () => import('./pages/NotificacionesPage'),
  },
}
