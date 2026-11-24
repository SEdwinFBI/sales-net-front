import { Fingerprint, Radio, Settings, ShieldCheck, Store, Users } from 'lucide-react'
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
        path: 'configuracion',
        meta: {
          name: 'Configuración',
          description: 'Ajustes de tu cuenta',
          permissions: ['admin', 'vendedor'],
          hideFromSidebar: true,
          agentHint: 'Configuracion: elegir que accesos de busqueda rapida se ven en el encabezado. Solo navegar.',
          lazy: () => import('./settings/pages/ConfiguracionPage'),
        },
      },
      {
        path: 'sucursales',
        meta: {
          name: 'Sucursales',
          description: 'Gestión de sucursales',
          icon: Store,
          permissions: ['admin'],
          agentHint: 'Sucursales (puestos): listar, buscar, crear, editar y desactivar; ver los vendedores asignados con ver_equipo_sucursal.',
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
          agentHint: 'Equipo de una sucursal: ver sus vendedores y usuarios, agregar o quitar vendedores (pide confirmacion).',
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
          agentHint: 'Usuarios y vendedores: buscar, crear, editar, eliminar y cambiar permisos de evidencia y anulacion. Nunca maneja contrasenas.',
          lazy: () => import('./users/pages/UsuariosPage'),
        },
      },
      {
        path: 'auditoria',
        meta: {
          name: 'Auditoría en vivo',
          description: 'Actividad y audio en vivo de vendedores',
          icon: Radio,
          permissions: ['admin'],
          agentHint: 'Solo navegar: auditoria en vivo de vendedores conectados; el agente no la opera ni escucha audio.',
          lazy: () => import('@/features/audit/pages/AuditoriaPage'),
        },
      },
      {
        path: 'passkeys',
        meta: {
          name: 'Acceso con dispositivo',
          description: 'Acceso con tus dispositivos',
          icon: Fingerprint,
          permissions: ['admin', 'vendedor'],
          agentHint: 'Navega aqui cuando el usuario quiera registrar o gestionar sus passkeys; el usuario lo hace, el agente no.',
          lazy: () => import('@/features/auth/pages/PasskeysPage'),
        },
      },
      {
        path: 'patron-acceso',
        meta: {
          name: 'Patrón de acceso',
          description: 'Configuración del patrón personal de ingreso',
          icon: ShieldCheck,
          permissions: ['admin', 'vendedor'],
          agentHint: 'Navega aqui cuando el usuario quiera configurar su patron de acceso; el usuario lo configura, el agente no.',
          lazy: () => import('./users/pages/PatronAccesoPage'),
        },
      },
      {
        path: 'notificaciones',
        meta: {
          name: 'Notificaciones',
          description: 'Destinatarios de notificaciones',
          permissions: ['admin'],
          hideFromSidebar: true,
          agentHint: 'Notificaciones: programacion de avisos de cobros (dias y horas) y destinatarios de correo con sus preferencias.',
          lazy: () => import('./notifications/pages/NotificacionesPage'),
        },
      },
    ],
  },
]
