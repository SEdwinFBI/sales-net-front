import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'

export const invalidateDebtReports = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [...queryKeys.reporting.all, 'deudores'] })
  queryClient.invalidateQueries({ queryKey: [...queryKeys.reporting.all, 'dashboard'] })
}
