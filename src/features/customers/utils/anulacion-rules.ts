import type { AuthUser } from '@/features/core/store/auth-store'
import { puedeAnular } from '@/features/sales/utils/anulacion-rules'
import type { Abono } from '../types/clientes'

type AnulacionUser = Pick<AuthUser, 'role' | 'puede_anular'> | null | undefined

/** Misma regla de visibilidad que el botón «Anular abono»: pagos reales y aún no revertidos. */
export function puedeAnularAbono(user: AnulacionUser, abono: Pick<Abono, 'monto' | 'revertido'>): boolean {
  return puedeAnular(user) && Number(abono.monto) > 0 && !abono.revertido
}

/** Por qué un abono no se puede anular (para decírselo al usuario), o null si sí se puede. */
export function motivoNoAnulableAbono(user: AnulacionUser, abono: Pick<Abono, 'monto' | 'revertido'>): string | null {
  if (!puedeAnular(user)) return 'No tienes permiso para anular abonos.'
  if (Number(abono.monto) <= 0) return 'Ese registro es la reversion de otro abono: no se puede anular.'
  if (abono.revertido) return 'Ese abono ya fue revertido.'
  return null
}
