export type PreferenciaNotificacion =
  | 'recibir_stock_bajo'
  | 'recibir_abonos'
  | 'recibir_clientes_deudas'
  | 'recibir_ventas_realizadas'

export type DestinatarioNotificacion = {
  id: number
  email: string
  nombre_persona_email: string
  recibir_stock_bajo: boolean
  recibir_abonos: boolean
  recibir_clientes_deudas: boolean
  recibir_ventas_realizadas: boolean
}

export type DestinatariosFilters = {
  search?: string
  page?: number
  page_size?: number
}

export type DestinatariosResponse = {
  count: number
  next: string | null
  previous: string | null
  results: DestinatarioNotificacion[]
}

export type CrearDestinatarioPayload = Omit<DestinatarioNotificacion, 'id'>

export type ActualizarDestinatariosPayload = {
  destinatarios: Array<Pick<DestinatarioNotificacion, 'id'> & Record<PreferenciaNotificacion, boolean>>
}

