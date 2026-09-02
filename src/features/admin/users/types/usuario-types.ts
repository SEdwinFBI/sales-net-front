export type Usuario = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  fullName: string
  role: string | null
  is_active: boolean
  created_at: string
  hora_entrada: string | null
  hora_salida: string | null
  sucursales: number[]
}

export type CreateUsuarioPayload = {
  username: string
  password: string
  first_name: string
  last_name: string
  email?: string
  role?: string
  hora_entrada?: string
  hora_salida?: string
  sucursales?: number[]
}

export type UpdateUsuarioPayload = {
  id: number
  username?: string
  password?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
  hora_entrada?: string
  hora_salida?: string
  sucursales?: number[]
}
