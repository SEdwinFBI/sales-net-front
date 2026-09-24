import { api } from '@/lib/api'

export type DiaNotificacion = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ConfiguracionNotificacionCobros {
  dias_notificacion: number[]
  hora_notificacion: string | null
  horas_notificacion: string[]
  ultimo_envio: string | null
  zona_horaria: string
  ultima_fecha_envio: string | null
}

export type ActualizarHorarioCobros =
  | { dias_notificacion?: number[]; horas_notificacion: string[] }
  | { dias_notificacion: number[]; hora_notificacion?: string | null }
  | { dias_notificacion?: number[]; hora_notificacion: string | null }

const ENDPOINT = '/admin/configuracion_notificacion_cobros/'

export async function getHorarioCobros(): Promise<ConfiguracionNotificacionCobros> {
  const { data } = await api.get<ConfiguracionNotificacionCobros>(ENDPOINT)
  return data
}

export async function updateHorarioCobros(payload: ActualizarHorarioCobros): Promise<ConfiguracionNotificacionCobros> {
  const { data } = await api.patch<ConfiguracionNotificacionCobros>(ENDPOINT, payload)
  return data
}
