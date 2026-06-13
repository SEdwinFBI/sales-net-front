import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getReporteDeudores } from '../services/reportes-service'

export const useReporteDeudores = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reporting.deudores(),
    queryFn: getReporteDeudores,
    staleTime: 1000 * 60 * 5,
  })

  return {
    clientes: data?.clientes ?? [],
    resumen: data?.resumen,
    isLoading,
    isError,
  }
}
