import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { closePdfPreview, usePdfPreviewStore } from './pdf-preview'
import { previewReport } from './report-pdf'

vi.mock('@/lib/api', () => ({ api: { request: vi.fn() } }))
const columns = [{ id: 'tabla', title: 'Clientes con saldo pendiente', columns: [{ id: '0', label: 'Cliente' }, { id: '1', label: 'Saldo' }], selected: ['0', '1'] }]

describe('columnas de reportes PDF', () => {
  afterEach(() => { closePdfPreview(); vi.clearAllMocks() })

  it('solicita ajuste automático y lee la orientación real del backend', async () => {
    vi.mocked(api.request).mockResolvedValue({
      data: new Blob(['%PDF']), headers: { 'x-pdf-columns': JSON.stringify(columns), 'x-pdf-orientation': 'portrait' },
    })
    await previewReport('/reportes/ventas', 'ventas.pdf')
    const preview = usePdfPreviewStore.getState().document!
    expect(preview.orientation).toBe('portrait')
    const result = await preview.reload!({ tabla: ['0'] }, 'tabla', 'auto')
    expect(result.orientation).toBe('portrait')
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { columns: JSON.stringify({ tables: { tabla: ['0'] }, section: 'tabla', orientation: 'auto' }) },
    }))
  })

  it('envía la orientación elegida junto con la sección y sus columnas', async () => {
    vi.mocked(api.request).mockResolvedValue({
      data: new Blob(['%PDF']), headers: { 'x-pdf-columns': JSON.stringify(columns) },
    })
    await previewReport('/reportes/ventas', 'ventas.pdf', { params: { output: 'pdf', id_sucursal: 2 } })
    await usePdfPreviewStore.getState().document!.reload!({ tabla: ['0'] }, 'tabla', 'portrait')
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { output: 'pdf', id_sucursal: 2, columns: JSON.stringify({
        tables: { tabla: ['0'] }, section: 'tabla', orientation: 'portrait',
      }) },
    }))
    await usePdfPreviewStore.getState().document!.reload!({ tabla: ['0'] }, null, 'landscape')
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { output: 'pdf', id_sucursal: 2, columns: JSON.stringify({
        tables: { tabla: ['0'] }, section: null, orientation: 'landscape',
      }) },
    }))
  })

  it('abre el primer reporte separado y conserva la opción del documento completo', async () => {
    const groups = [...columns, { ...columns[0], id: 'inventario', title: 'Inventario' }]
    vi.mocked(api.request).mockResolvedValue({
      data: new Blob(['%PDF']), headers: { 'x-pdf-columns': JSON.stringify(groups) },
    })
    await previewReport('/ventas/historial/pdf', 'historial.pdf', { method: 'post', data: { ids: [1] } })
    const preview = usePdfPreviewStore.getState().document!
    expect(preview.activeSection).toBe('tabla')
    expect(preview.columns).toHaveLength(2)
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { ids: [1], columns: { tables: {}, section: 'tabla' } },
    }))
    await preview.reload!({ tabla: ['0'] }, 'inventario')
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { ids: [1], columns: { tables: { tabla: ['0'] }, section: 'inventario' } },
    }))
    await preview.reload!({ tabla: ['0'] }, null)
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { ids: [1], columns: { tabla: ['0'] } },
    }))
  })

  it('carga opciones del backend y conserva filtros GET al regenerar', async () => {
    vi.mocked(api.request).mockResolvedValue({
      data: new Blob(['%PDF']), headers: {
        'x-pdf-columns': JSON.stringify(columns),
        'x-pdf-title': JSON.stringify('Reporte de deudores'),
      },
    })
    await previewReport('/reportes/deudores', 'deudores.pdf', { params: { nombre: 'Ana', output: 'pdf' } })
    const preview = usePdfPreviewStore.getState().document!
    expect(preview.columns).toEqual(columns)
    expect(preview.title).toBe('Reporte de deudores')
    expect(usePdfPreviewStore.getState().pendingNavigation).toBe(true)
    usePdfPreviewStore.setState({ pendingNavigation: false })
    await preview.reload!({ tabla: ['0'] })
    expect(usePdfPreviewStore.getState().pendingNavigation).toBe(false)
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      url: '/reportes/deudores', method: 'get',
      params: { nombre: 'Ana', output: 'pdf', columns: '{"tabla":["0"]}' },
    }))
  })

  it('conserva IDs y filtros del historial POST al cambiar columnas', async () => {
    vi.mocked(api.request).mockResolvedValue({ data: new Blob(['%PDF']), headers: {} })
    await previewReport('/ventas/historial/pdf', 'historial.pdf', {
      method: 'post', data: { ids: [12, 15], filtros: { estado: 'PENDIENTE' } },
    })
    await usePdfPreviewStore.getState().document!.reload!({ tabla: ['1'] })
    expect(api.request).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'post', data: {
        ids: [12, 15], filtros: { estado: 'PENDIENTE' }, columns: { tabla: ['1'] },
      },
    }))
  })

  it('un error de regeneración conserva el documento anterior', async () => {
    vi.mocked(api.request).mockResolvedValueOnce({ data: new Blob(['%PDF']), headers: {} })
    await previewReport('/reportes/cobros', 'cobros.pdf')
    const previous = usePdfPreviewStore.getState().document!
    vi.mocked(api.request).mockRejectedValueOnce(new Error('Error de servidor'))
    await expect(previous.reload!({ tabla: ['0'] })).rejects.toThrow()
    expect(usePdfPreviewStore.getState().document).toBe(previous)
  })
})
