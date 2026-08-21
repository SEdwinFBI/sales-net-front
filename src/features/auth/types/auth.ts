

export type AuthCredentials = {
  username: string
  password: string
}
export type AppRole = 'admin' | 'vendedor'

export type Sucursal = {
  id: number
  nombre: string
}

export type User = {
  fullName: string,
  id: number,
  role: AppRole,
  permissions: AppRole[],
  username: string,
  sucursalActual: Sucursal | null,
}

export type AuthSession = {
  user: User
  access: string
  refresh: string
}

/** Respuesta de login cuando el usuario pertenece a mas de una sucursal:
 * no trae tokens todavia, hay que elegir sucursal con `pre_token`. */
export type SeleccionSucursalRequerida = {
  requiere_seleccion_sucursal: true
  sucursales: Sucursal[]
  pre_token: string
}

export type LoginResult = AuthSession | SeleccionSucursalRequerida

export function requiereSeleccionSucursal(result: LoginResult): result is SeleccionSucursalRequerida {
  return (result as SeleccionSucursalRequerida).requiere_seleccion_sucursal === true
}
