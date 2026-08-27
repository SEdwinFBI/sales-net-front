import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDestinatario, getDestinatarios, updateDestinatarios } from '../services/notificaciones-service'
import type { ActualizarDestinatariosPayload, CrearDestinatarioPayload } from '../types/notificaciones-types'

const queryKey = ['adminNotificaciones', 'destinatarios'] as const

export function useDestinatarios() {
  return useQuery({ queryKey, queryFn: getDestinatarios })
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
