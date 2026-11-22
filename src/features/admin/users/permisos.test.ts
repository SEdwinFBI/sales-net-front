import { describe, expect, it } from 'vitest'

import { PERMISOS, resumenPermisos } from './permisos'
import type { Usuario } from './types/usuario-types'

const usuario = (extra: Partial<Usuario> = {}): Usuario => ({
  id: 1,
  username: 'henry',
  first_name: 'Henry',
  last_name: 'Mendez',
  email: '',
  fullName: 'Henry Mendez',
  role: 'vendedor',
  is_active: true,
  puede_anular: true,
  evidencia_fotografica: true,
  transmision_audio: false,
  agente_ia: false,
  created_at: '',
  hora_entrada: null,
  hora_salida: null,
  sucursales: [],
  ...extra,
})

const permiso = (key: string) => PERMISOS.find((p) => p.key === key)!

describe('permisos por usuario', () => {
  it('audio y agente vienen apagados; foto y anular encendidos', () => {
    const u = usuario()
    expect(PERMISOS.map((p) => [p.key, p.valor(u)])).toEqual([
      ['evidencia_fotografica', true],
      ['puede_anular', true],
      ['transmision_audio', false],
      ['agente_ia', false],
    ])
  })

  it('al admin no se le cambia anular (siempre puede) ni el audio (solo vendedores)', () => {
    const admin = usuario({ role: 'admin', puede_anular: false })
    expect(permiso('puede_anular').valor(admin)).toBe(true)
    expect(permiso('puede_anular').bloqueo(admin)).toMatch(/siempre/)
    expect(permiso('transmision_audio').bloqueo(admin)).toMatch(/vendedores/)
    expect(permiso('agente_ia').bloqueo(admin)).toBeNull()
  })

  it('el resumen cuenta solo los permisos que se pueden cambiar', () => {
    expect(resumenPermisos(usuario({ agente_ia: true }))).toEqual({ activos: 3, total: 4 })
    expect(resumenPermisos(usuario({ role: 'admin' }))).toEqual({ activos: 1, total: 2 })
  })
})
