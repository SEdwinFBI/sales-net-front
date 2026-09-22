import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getHorarioCobros, updateHorarioCobros } from '../services/horario-cobros-service'

const queryKey = ['adminNotificaciones', 'horarioCobros'] as const

export function useHorarioCobros() {
  return useQuery({ queryKey, queryFn: getHorarioCobros })
}

export function useUpdateHorarioCobros() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateHorarioCobros,
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
  })
}
