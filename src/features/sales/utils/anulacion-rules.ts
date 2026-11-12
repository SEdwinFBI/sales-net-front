import type { AuthUser } from '@/features/core/store/auth-store'
import type { Venta } from '../types/sales'

type AnulacionUser = Pick<AuthUser, 'role' | 'puede_anular'> | null | undefined

/** Un admin siempre puede anular; los demás, salvo que se les haya quitado el permiso (`false` explícito). */
export function puedeAnular(user: AnulacionUser): boolean {
  return user?.role === 'admin' || user?.puede_anular !== false
}

/** Estados en los que una venta se puede anular. */
export const ESTADOS_ANULABLES: ReadonlyArray<Venta['estado']> = ['PENDIENTE', 'PAGADA']

/** Misma regla de visibilidad que el botón «Anular venta». */
export function puedeAnularVenta(user: AnulacionUser, venta: Pick<Venta, 'estado'>): boolean {
  return puedeAnular(user) && ESTADOS_ANULABLES.includes(venta.estado)
}

/** Por qué una venta no se puede anular (para decírselo al usuario), o null si sí se puede. */
export function motivoNoAnulableVenta(user: AnulacionUser, venta: Pick<Venta, 'estado'>): string | null {
  if (!puedeAnular(user)) return 'No tienes permiso para anular ventas.'
  if (!ESTADOS_ANULABLES.includes(venta.estado)) return `Una venta en estado ${venta.estado} no se puede anular.`
  return null
}
