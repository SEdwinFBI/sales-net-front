import { api } from '@/lib/api'
import type {
  ActualizarDestinatariosPayload,
  CrearDestinatarioPayload,
  DestinatarioNotificacion,
} from '../types/notificaciones-types'

const ENDPOINT = '/admin/destinatarios_notificaciones/'

const normalize = (destinatario: DestinatarioNotificacion): DestinatarioNotificacion => ({
  ...destinatario,
  recibir_stock_bajo: destinatario.recibir_stock_bajo ?? false,
  recibir_abonos: destinatario.recibir_abonos ?? false,
  recibir_clientes_deudas: destinatario.recibir_clientes_deudas ?? false,
  recibir_ventas_realizadas: destinatario.recibir_ventas_realizadas ?? false,
})

export async function getDestinatarios(): Promise<DestinatarioNotificacion[]> {
  const { data } = await api.get<DestinatarioNotificacion[]>(ENDPOINT)
  return data.map(normalize)
}

export async function createDestinatario(payload: CrearDestinatarioPayload): Promise<DestinatarioNotificacion> {
  const { data } = await api.post<{ destinatario: DestinatarioNotificacion }>(ENDPOINT, payload)
  return normalize(data.destinatario)
}

export async function updateDestinatarios(payload: ActualizarDestinatariosPayload): Promise<void> {
  await api.patch(ENDPOINT, payload)
}
