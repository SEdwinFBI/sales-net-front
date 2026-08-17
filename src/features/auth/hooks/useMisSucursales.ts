import { useQuery } from '@tanstack/react-query'
import { getMisSucursalesService } from '../services/auth-service'
import { useAuthStore } from '@/features/core/store/auth-store'

/** Sucursales del usuario autenticado, para el selector del header. Los
 * admins no tienen sucursal (ven todo el sistema), así que no aplica. */
export function useMisSucursales() {
  const role = useAuthStore((state) => state.user?.role)
  const { data } = useQuery({
    queryKey: ['auth', 'mis-sucursales'],
    queryFn: getMisSucursalesService,
    enabled: role === 'vendedor',
    staleTime: 1000 * 60 * 5,
  })

  return data ?? []
}
