import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import type { ReporteDeudores, ReporteDeudoresFilters } from '../types/reportes'
import { downloadReporteDeudoresPdf, getReporteDeudores } from './reportes-service'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const reporte: ReporteDeudores['data'] = {
  clientes: [{
    id: 12, nombre_completo: 'Cliente de prueba', telefono: '12345678',
    balance: 150, dias_notificacion: [], dias_notificacion_display: [],
    ultima_compra: null, total_ventas_pendientes: 150, total_abonado: 0,
  }],
  resumen: { total_deudores: 1, total_adeudado: 150 },
}

// Simula un filtro antiguo conservado por un consumidor anterior.
const filters: ReporteDeudoresFilters & { dia_notificacion: number } = {
  nombre: 'Cliente', lugar: 'Zona 1', dia_notificacion: 2,
}

describe('reporte de deudores con programación general', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('conserva los deudores cuando los avisos están pausados, sin enviar el filtro antiguo', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'success', data: reporte } })
    await expect(getReporteDeudores(filters)).resolves.toEqual(reporte)
    expect(api.get).toHaveBeenCalledWith('/reportes/deudores', {
      params: { nombre: 'Cliente', search: 'Cliente', lugar: 'Zona 1' },
    })
  })

  it('consulta todos los deudores sin imponer días ni otros filtros', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'success', data: reporte } })
    await getReporteDeudores()
    expect(api.get).toHaveBeenCalledWith('/reportes/deudores', { params: {} })
  })

  it('exporta el PDF con los mismos filtros de nombre y lugar que la consulta', async () => {
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('window', { URL: { createObjectURL: vi.fn(() => 'blob:reporte'), revokeObjectURL } })
    vi.stubGlobal('document', { createElement: vi.fn(() => link), body: { appendChild: vi.fn() } })
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(['pdf']) })
    await downloadReporteDeudoresPdf(filters)
    expect(api.get).toHaveBeenCalledWith('/reportes/deudores', {
      params: { nombre: 'Cliente', search: 'Cliente', lugar: 'Zona 1', output: 'pdf' },
      responseType: 'blob',
    })
    expect(link.download).toMatch(/^reporte_deudores_.*\.pdf$/)
    expect(link.click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:reporte')
  })
})
