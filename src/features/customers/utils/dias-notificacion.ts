import type { DiaNotificacion } from '../types/clientes'

export const DIAS_NOTIFICACION: ReadonlyArray<{ value: DiaNotificacion; label: string }> = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

export function mostrarDias(dias?: DiaNotificacion[]): string {
  return dias?.length
    ? dias.map(dia => DIAS_NOTIFICACION.find(item => item.value === dia)?.label).filter(Boolean).join(', ')
    : 'Sin asignar'
}
