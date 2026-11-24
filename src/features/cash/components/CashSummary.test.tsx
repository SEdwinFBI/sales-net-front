import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { useAuthStore } from '@/features/core/store/auth-store'
import type { User } from '@/features/auth/types/auth'
import { CashSummary } from './CashSummary'

vi.mock('@/features/core/store/auth-store', async () => {
  const { create } = await import('zustand')
  const store = create<{ user: User | null }>(() => ({ user: null }))
  return {
    useAuthStore: Object.assign(
      <T,>(selector: (state: { user: User | null }) => T) => selector(store.getState()),
      store,
    ),
  }
})

const originalUser = useAuthStore.getState().user
const user = (role: User['role']): User => ({
  id: 1, fullName: 'Prueba', username: 'prueba', role, permissions: [role], sucursalActual: null,
})
const caja = { entradas: '200', salidas: '50', ventas_efectivo: '9876.54', efectivo_esperado: '10026.54' }

describe('visibilidad de totales en caja', () => {
  afterEach(() => useAuthStore.setState({ user: originalUser }))

  it('el vendedor no ve los indicadores reservados aunque existan datos en memoria', () => {
    useAuthStore.setState({ user: user('vendedor') })
    const html = renderToStaticMarkup(<CashSummary caja={caja} expectedLabel="Saldo esperado hoy" />)
    expect(html).toContain('Entradas')
    expect(html).toContain('Gastos')
    expect(html).toContain('Resto')
    expect(html).not.toContain('Ventas efectivo')
    expect(html).not.toContain('Saldo esperado hoy')
  })

  it('el administrador conserva ambos indicadores', () => {
    useAuthStore.setState({ user: user('admin') })
    const html = renderToStaticMarkup(<CashSummary caja={caja} expectedLabel="Saldo esperado hoy" />)
    expect(html).toContain('Ventas efectivo')
    expect(html).toContain('Saldo esperado hoy')
  })
})
