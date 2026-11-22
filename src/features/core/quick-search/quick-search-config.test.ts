import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getClientes } from '@/features/customers/services/clientes-service'
import { MAX_RESULTS, QUICK_SEARCH_SOURCES, sourcesForPermissions } from './quick-search-config'

vi.mock('@/features/customers/services/clientes-service', () => ({ getClientes: vi.fn() }))

const cliente = (id: number, nombre: string, balance: number, telefono = '') =>
  ({ id, nombre_completo: nombre, balance, telefono, permitir_credito: true, direccion: '', fecha_creacion: '', activo: true })

describe('busqueda rapida', () => {
  beforeEach(() => vi.mocked(getClientes).mockReset())

  it('cada rol ve solo los accesos de las rutas que puede abrir', () => {
    expect(sourcesForPermissions(['admin']).map((s) => s.id)).toContain('clientes')
    expect(sourcesForPermissions(['vendedor']).map((s) => s.id)).toContain('clientes')
    expect(sourcesForPermissions([])).toEqual([])
  })

  it('clientes: busca activos, resalta la deuda y lleva a la ficha', async () => {
    vi.mocked(getClientes).mockResolvedValue({
      count: 2,
      results: [cliente(1, 'Sheny', 9095, '5512-3456'), cliente(2, 'Shemi Lopez', 0)],
    })
    const clientes = QUICK_SEARCH_SOURCES.find((s) => s.id === 'clientes')!
    const resultados = await clientes.search('she')

    expect(getClientes).toHaveBeenCalledWith(1, MAX_RESULTS, 'she', true)
    expect(resultados).toEqual([
      { id: 1, titulo: 'Sheny', detalle: '5512-3456', aviso: expect.stringMatching(/^Debe .*9,095\.00/), ruta: '/clientes/listado/1' },
      { id: 2, titulo: 'Shemi Lopez', detalle: undefined, aviso: undefined, ruta: '/clientes/listado/2' },
    ])
  })
})
