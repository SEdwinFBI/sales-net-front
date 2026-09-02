export { adminRoutes } from './routes'

// Branches
export { useSucursales } from './branches/hooks/useSucursales'
export { useSucursalDetalle } from './branches/hooks/useSucursalDetalle'
export { useCreateSucursal } from './branches/hooks/useCreateSucursal'
export { useUpdateSucursal } from './branches/hooks/useUpdateSucursal'
export { useDeleteSucursal } from './branches/hooks/useDeleteSucursal'
export { useSetAccesoUsuarioSucursal } from './branches/hooks/useSetAccesoUsuarioSucursal'
export type { Sucursal, SucursalConUsuarios, CreateSucursalPayload, UpdateSucursalPayload } from './branches/types/sucursal-types'

// Users
export { useUsuarios } from './users/hooks/useUsuarios'
export { useCreateUsuario } from './users/hooks/useCreateUsuario'
export { useUpdateUsuario } from './users/hooks/useUpdateUsuario'
export { useDeleteUsuario } from './users/hooks/useDeleteUsuario'
export type { Usuario, CreateUsuarioPayload, UpdateUsuarioPayload } from './users/types/usuario-types'

// Notifications
export { useDestinatarios } from './notifications/hooks/useDestinatarios'
export type { DestinatarioNotificacion, CrearDestinatarioPayload, ActualizarDestinatariosPayload, PreferenciaNotificacion } from './notifications/types/notificaciones-types'
