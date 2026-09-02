export type Sucursal = {
  id: number
  nombre: string
  direccion: string
  telefono: string
  activo: boolean
  fecha_creacion: string
  /** Solo viene en el listado (`GET /admin/sucursales/`), no en create/update. */
  usuarios_count?: number
}

export type SucursalConUsuarios = Sucursal & {
  usuarios: { id: number; username: string; full_name: string }[]
}

export type CreateSucursalPayload = {
  nombre: string
  direccion?: string
  telefono?: string
  activo?: boolean
}

export type UpdateSucursalPayload = {
  id: number
  nombre?: string
  direccion?: string
  telefono?: string
  activo?: boolean
}
