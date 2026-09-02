import { api } from '@/lib/api'
import type {
  ActualizarDestinatariosPayload,
  CrearDestinatarioPayload,
  DestinatarioNotificacion,
  DestinatariosFilters,
  DestinatariosResponse,
} from '../types/notificaciones-types'

const ENDPOINT = '/admin/destinatarios_notificaciones/'

const normalize = (destinatario: DestinatarioNotificacion): DestinatarioNotificacion => ({
  ...destinatario,
  recibir_stock_bajo: destinatario.recibir_stock_bajo ?? false,
  recibir_abonos: destinatario.recibir_abonos ?? false,
  recibir_clientes_deudas: destinatario.recibir_clientes_deudas ?? false,
  recibir_ventas_realizadas: destinatario.recibir_ventas_realizadas ?? false,
})

export async function getDestinatarios(filters?: DestinatariosFilters): Promise<DestinatariosResponse> {
  const params: Record<string, unknown> = {}
  if (filters?.search) params.search = filters.search
  if (filters?.page) params.page = filters.page
  if (filters?.page_size) params.page_size = filters.page_size

  const { data } = await api.get<any>(ENDPOINT, { params })
  if (data?.data && Array.isArray(data.data.results)) {
    return {
      count: data.data.count ?? data.data.results.length,
      next: data.data.next ?? null,
      previous: data.data.previous ?? null,
      results: data.data.results.map(normalize),
    }
  }
  if (data?.results && Array.isArray(data.results)) {
    return {
      count: data.count ?? data.results.length,
      next: data.next ?? null,
      previous: data.previous ?? null,
      results: data.results.map(normalize),
    }
  }
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data.map(normalize),
    }
  }
  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
  }
}

export async function createDestinatario(payload: CrearDestinatarioPayload): Promise<DestinatarioNotificacion> {
  const { data } = await api.post<{ destinatario: DestinatarioNotificacion }>(ENDPOINT, payload)
  return normalize(data.destinatario)
}

export async function updateDestinatarios(payload: ActualizarDestinatariosPayload): Promise<void> {
  await api.patch(ENDPOINT, payload)
}

export async function deleteDestinatario(id: number): Promise<void> {
  await api.delete(ENDPOINT, { data: { id } })
}
