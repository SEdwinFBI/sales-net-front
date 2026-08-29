import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'

/** Refresca los reportes de deudores y el dashboard tras un cambio que afecta saldos de clientes. */
export const invalidateDebtReports = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [...queryKeys.reporting.all, 'deudores'] })
  queryClient.invalidateQueries({ queryKey: [...queryKeys.reporting.all, 'dashboard'] })
}
