import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPosSettings, updatePosSettings } from '@/lib/pos-settings'

export const posSettingsKey = ['pos', 'settings'] as const

export function usePosSettings(enabled = true) {
  return useQuery({
    queryKey: posSettingsKey,
    queryFn: getPosSettings,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
}

export function useUpdatePosSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updatePosSettings,
    onSuccess: (data) => client.setQueryData(posSettingsKey, data),
  })
}
