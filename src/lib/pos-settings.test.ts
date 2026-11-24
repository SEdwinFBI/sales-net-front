import { describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { canShowStockMeter, getPosSettings, updatePosSettings } from './pos-settings'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), patch: vi.fn() } }))

describe('barras de stock para vendedores', () => {
  it('el administrador siempre las ve y el vendedor requiere la habilitación', () => {
    expect(canShowStockMeter('admin', false)).toBe(true)
    expect(canShowStockMeter('admin', true)).toBe(true)
    expect(canShowStockMeter('vendedor', false)).toBe(false)
    expect(canShowStockMeter('vendedor', true)).toBe(true)
    expect(canShowStockMeter(undefined, true)).toBe(false)
  })

  it('consulta y guarda la misma configuración del backend', async () => {
    const settings = { mostrar_barras_stock_vendedores: true }
    vi.mocked(api.get).mockResolvedValue({ data: settings })
    vi.mocked(api.patch).mockResolvedValue({ data: settings })
    await expect(getPosSettings()).resolves.toEqual(settings)
    await expect(updatePosSettings(true)).resolves.toEqual(settings)
    expect(api.get).toHaveBeenCalledWith('/admin/configuracion_pos/')
    expect(api.patch).toHaveBeenCalledWith('/admin/configuracion_pos/', settings)
  })
})
