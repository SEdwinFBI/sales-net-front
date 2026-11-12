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
          agentHint: 'Lista de clientes: buscar y filtrar por credito o estado. Crear, editar o eliminar clientes: solo admin.',
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
          agentHint: 'Ficha del cliente: registrar venta, abono o ajuste (solo clientes con credito), ver compras y abonos, anular venta o abono, precios.',
          lazy: () => import('./pages/ClienteDetailPage'),
          hideFromSidebar: true,
        },
      },
      {
        path: 'listado/:id/precios',
        meta: {
          name: 'Precios del cliente',
          description: 'Precios asignados al cliente',
          icon: Users,
          permissions: ['admin', 'vendedor'],
          agentHint: 'Precios del cliente: ver sus precios especiales; solo el admin puede editarlos o eliminarlos.',
          lazy: () => import('./pages/ClientePreciosPage'),
          hideFromSidebar: true,
        },
      },
    ],
  },
]
