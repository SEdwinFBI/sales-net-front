import type { Usuario } from './types/usuario-types'

export type PermisoKey = 'evidencia_fotografica' | 'puede_anular' | 'transmision_audio' | 'agente_ia'

/** Un permiso por usuario: lo usan las columnas de la tabla (escritorio) y el panel (teléfono). */
export type PermisoDef = {
  key: PermisoKey
  grupo: 'Ventas' | 'Comunicación' | 'Asistente'
  label: string
  descripcion: string
  valor: (usuario: Usuario) => boolean
  /** Motivo por el que no se puede cambiar para este usuario, o null. */
  bloqueo: (usuario: Usuario) => string | null
}

export const PERMISOS: PermisoDef[] = [
  {
    key: 'evidencia_fotografica',
    grupo: 'Ventas',
    label: 'Evidencia fotográfica',
    descripcion: 'Pide una foto al confirmar cada venta.',
    valor: (u) => u.evidencia_fotografica ?? true,
    bloqueo: () => null,
  },
  {
    key: 'puede_anular',
    grupo: 'Ventas',
    label: 'Anular ventas y abonos',
    descripcion: 'Puede anular ventas y abonos ya registrados.',
    valor: (u) => u.role === 'admin' || (u.puede_anular ?? true),
    bloqueo: (u) => (u.role === 'admin' ? 'El admin siempre puede anular.' : null),
  },
  {
    key: 'transmision_audio',
    grupo: 'Comunicación',
    label: 'Transmisión de audio',
    descripcion: 'El admin puede escucharlo en vivo.',
    valor: (u) => u.transmision_audio ?? false,
    bloqueo: (u) => (u.role !== 'vendedor' ? 'Solo aplica a vendedores.' : null),
  },
  {
    key: 'agente_ia',
    grupo: 'Asistente',
    label: 'Agente de IA',
    descripcion: 'Puede usar el asistente de voz y chat.',
    valor: (u) => u.agente_ia ?? false,
    bloqueo: () => null,
  },
]

/** Permisos que se pueden cambiar para el usuario y cuántos están activos (para el resumen). */
export function resumenPermisos(usuario: Usuario): { activos: number; total: number } {
  const aplicables = PERMISOS.filter((permiso) => permiso.bloqueo(usuario) === null)
  return { activos: aplicables.filter((permiso) => permiso.valor(usuario)).length, total: aplicables.length }
}
