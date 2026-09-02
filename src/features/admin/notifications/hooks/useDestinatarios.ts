import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDestinatario, deleteDestinatario, getDestinatarios, updateDestinatarios } from '../services/notificaciones-service'
import type { ActualizarDestinatariosPayload, CrearDestinatarioPayload, DestinatariosFilters } from '../types/notificaciones-types'

const queryKey = ['adminNotificaciones', 'destinatarios'] as const

export function useDestinatarios(filters?: DestinatariosFilters) {
  return useQuery({
    queryKey: [...queryKey, filters] as const,
    queryFn: () => getDestinatarios(filters),
  })
}

export function useCreateDestinatario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearDestinatarioPayload) => createDestinatario(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
}

export function useUpdateDestinatarios() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ActualizarDestinatariosPayload) => updateDestinatarios(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
}

export function useDeleteDestinatario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDestinatario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
}
