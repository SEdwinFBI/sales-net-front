import { api } from '@/lib/api'

export interface ConfiguracionNotificacionCobros {
  hora_notificacion: string | null
  zona_horaria: string
  ultima_fecha_envio: string | null
}

const ENDPOINT = '/admin/configuracion_notificacion_cobros/'

export async function getHorarioCobros(): Promise<ConfiguracionNotificacionCobros> {
  const { data } = await api.get<ConfiguracionNotificacionCobros>(ENDPOINT)
  return data
}

export async function updateHorarioCobros(hora: string | null): Promise<ConfiguracionNotificacionCobros> {
  const { data } = await api.patch<ConfiguracionNotificacionCobros>(ENDPOINT, { hora_notificacion: hora })
  return data
}
