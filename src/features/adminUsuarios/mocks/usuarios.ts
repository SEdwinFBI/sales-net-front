import type { Usuario } from '../types/usuario-types'

export const mockUsuarios: Usuario[] = [
  { id: '1', fullName: 'Admin Principal', username: 'admin', role: 'admin' },
  { id: '2', fullName: 'Vendedor Uno', username: 'vendedor1', role: 'vendedor' },
  { id: '3', fullName: 'Vendedor Dos', username: 'vendedor2', role: 'vendedor' },
  { id: '4', fullName: 'Ana Lopez', username: 'ana.lopez', role: 'vendedor' },
  { id: '5', fullName: 'Carlos Ruiz', username: 'carlos.ruiz', role: 'admin' },
]