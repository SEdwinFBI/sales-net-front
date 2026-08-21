import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Store } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useMisSucursales } from '../hooks/useMisSucursales'
import { cambiarSucursalService } from '../services/auth-service'

/** Muestra la sucursal activa; si el usuario pertenece a más de una, se
 * convierte en un selector para cambiar sin cerrar sesión. */
export default function SucursalSwitcher() {
  const user = useAuthStore((state) => state.user)
  const applySession = useAuthStore((state) => state.login)
  const queryClient = useQueryClient()
  const misSucursales = useMisSucursales()
  const [isChanging, setIsChanging] = useState(false)

  if (!user) return null

  if (misSucursales.length <= 1) {
    return (
      <p className="text-xs font-medium uppercase tracking-wide text-neutral/55">
        {user.sucursalActual?.nombre ?? user.username}
      </p>
    )
  }

  const handleChange = async (idSucursal: number) => {
    if (idSucursal === user.sucursalActual?.id) return
    setIsChanging(true)
    try {
      const session = await cambiarSucursalService(idSucursal)
      applySession(session)
      // El stock/precios/movimientos que se cachearon son de la sucursal
      // anterior: hay que botar todo y que se vuelva a pedir con el
      // contexto nuevo.
      queryClient.clear()
      toast.success(`Ahora en ${session.user.sucursalActual?.nombre ?? 'la sucursal seleccionada'}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al cambiar de sucursal'))
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="relative">
      <Select
        aria-label="Cambiar de sucursal"
        value={String(user.sucursalActual?.id ?? '')}
        onChange={(e) => handleChange(Number(e.target.value))}
        disabled={isChanging}
        className="h-6 max-w-36 rounded-md border-0 bg-transparent py-0 pl-5 pr-1 text-right text-xs font-medium uppercase tracking-wide text-neutral/55 shadow-none hover:text-neutral"
      >
        {misSucursales.map((sucursal) => (
          <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
        ))}
      </Select>
      {isChanging ? (
        <Loader2 className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-neutral/55" />
      ) : (
        <Store className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-neutral/55" />
      )}
    </div>
  )
}
