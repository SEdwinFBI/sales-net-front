import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVentaEncabezado } from '../services/clientes-service'
import { useCreateVentaEncabezado } from './useCreateVentaEncabezado'

const state = vi.hoisted(() => ({
  user: { sucursalActual: null as { id: number } | null },
  run: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: { mutationFn: typeof state.run }) => {
    state.run = options.mutationFn
    return {}
  },
}))
vi.mock('@/features/core/store/auth-store', () => ({
  useAuthStore: (select: (value: { user: typeof state.user }) => unknown) => select({ user: state.user }),
}))
vi.mock('../services/clientes-service', () => ({ createVentaEncabezado: vi.fn() }))

const venta = { id_cliente: 12, id_forma_pago: 2, estado: 'PENDIENTE', monto: '150.00' }

describe('sucursal al registrar una venta desde clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.user.sucursalActual = null
  })

  it('envía la sucursal seleccionada por un administrador sin alterar la venta a crédito', async () => {
    useCreateVentaEncabezado()
    await state.run({ ...venta, id_sucursal: 7 })
    expect(createVentaEncabezado).toHaveBeenCalledWith({
      id_sucursal: 7, id_cliente: 12, id_forma_pago: 2, estado: 'PENDIENTE',
      total: '150.00', idempotencia_key: expect.any(String), observacion: null,
    })
  })

  it('mantiene la sucursal de la sesión cuando ya está asignada', async () => {
    state.user.sucursalActual = { id: 3 }
    useCreateVentaEncabezado()
    await state.run({ ...venta, id_sucursal: 7 })
    expect(createVentaEncabezado).toHaveBeenCalledWith(expect.objectContaining({ id_sucursal: 3 }))
  })

  it('evita enviar una venta sin sucursal y explica cómo corregirlo', async () => {
    useCreateVentaEncabezado()
    await expect(state.run(venta)).rejects.toThrow('Selecciona la sucursal para registrar la venta')
    expect(createVentaEncabezado).not.toHaveBeenCalled()
  })
})
