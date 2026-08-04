import type { DiaNotificacion } from '../types/clientes'

export const DIAS_NOTIFICACION: ReadonlyArray<{
  value: DiaNotificacion
  label: string
}> = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

const NOMBRE_DIA = new Map(
  DIAS_NOTIFICACION.map((dia) => [dia.value, dia.label]),
)

export function mostrarDias(dias?: DiaNotificacion[]): string {
  if (!dias?.length) return 'Sin asignar'

  return dias
    .map((dia) => NOMBRE_DIA.get(dia))
    .filter((nombre): nombre is string => Boolean(nombre))
    .join(', ')
}
