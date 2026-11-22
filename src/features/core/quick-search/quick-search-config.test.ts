import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getUsuarios } from '@/features/admin/users/services/usuarios-service'
import { getArticleVariants } from '@/features/catalog/services/article-variants-service'
import { getArticles as getCatalogArticles } from '@/features/catalog/services/articles-service'
import { getClientes } from '@/features/customers/services/clientes-service'
import { getArticles as getPosArticles, searchVentas } from '@/features/sales/services/products-service'
import { MAX_RESULTS, QUICK_SEARCH_SOURCES, rutasPermitidas, sourcesForPermissions, type QuickSearchSourceId } from './quick-search-config'
import { useQuickSearchPrefs } from './quick-search-prefs'

vi.mock('@/features/customers/services/clientes-service', () => ({ getClientes: vi.fn() }))
vi.mock('@/features/sales/services/products-service', () => ({ getArticles: vi.fn(), searchVentas: vi.fn() }))
vi.mock('@/features/catalog/services/articles-service', () => ({ getArticles: vi.fn() }))
vi.mock('@/features/catalog/services/article-variants-service', () => ({ getArticleVariants: vi.fn() }))
vi.mock('@/features/admin/users/services/usuarios-service', () => ({ getUsuarios: vi.fn() }))

const source = (id: QuickSearchSourceId) => QUICK_SEARCH_SOURCES.find((s) => s.id === id)!
const ids = (permissions: ('admin' | 'vendedor')[]) => sourcesForPermissions(permissions).map((s) => s.id)
const cliente = (id: number, nombre: string, balance: number, telefono = '') =>
  ({ id, nombre_completo: nombre, balance, telefono, permitir_credito: true, direccion: '', fecha_creacion: '', activo: true })

beforeEach(() => vi.clearAllMocks())

describe('accesos por rol', () => {
  it('admin: clientes, productos (catalogo), ventas y usuarios; vendedor: sin usuarios', () => {
    expect(ids(['admin'])).toEqual(['clientes', 'productos', 'ventas', 'usuarios'])
    expect(ids(['vendedor'])).toEqual(['clientes', 'productos', 'ventas'])
    expect(ids([])).toEqual([])
  })
})

describe('busquedas', () => {
  it('clientes: activos, deuda resaltada y su ficha', async () => {
    vi.mocked(getClientes).mockResolvedValue({ count: 2, results: [cliente(1, 'Sheny', 9095, '5512-3456'), cliente(2, 'Shemi', 0)] })
    const resultados = await source('clientes').search('she', new Set())
    expect(getClientes).toHaveBeenCalledWith(1, MAX_RESULTS, 'she', true)
    expect(resultados).toEqual([
      { id: 1, titulo: 'Sheny', detalle: '5512-3456', aviso: expect.stringMatching(/^Debe .*9,095\.00/), ruta: '/clientes/listado/1' },
      { id: 2, titulo: 'Shemi', detalle: undefined, aviso: undefined, ruta: '/clientes/listado/2' },
    ])
  })

  it('productos con punto de venta: precio, stock y abre el POS ya buscado', async () => {
    vi.mocked(getPosArticles).mockResolvedValue({
      data: [
        { id: 7, name: 'Fajas ceda', category: '', image: null, variants: [{ id: 1, size: 'M', stock: 3, price: 25 }, { id: 2, size: 'L', stock: 0, price: 30 }] },
        { id: 8, name: 'Faja roja', category: '', image: null, variants: [{ id: 3, size: 'M', stock: 0, price: 20 }] },
      ],
    } as never)
    const [conStock, sinStock] = await source('productos').search('faja', rutasPermitidas(['vendedor']))
    expect(conStock).toMatchObject({ titulo: 'Fajas ceda', detalle: expect.stringMatching(/25\.00 · 3 uds$/), aviso: undefined, ruta: '/venta/punto-de-venta?buscar=Fajas+ceda' })
    expect(sinStock).toMatchObject({ aviso: 'Sin stock' })
    expect(getCatalogArticles).not.toHaveBeenCalled()
  })

  it('productos sin punto de venta (admin): catalogo con tallas y abre Articulos filtrado', async () => {
    vi.mocked(getCatalogArticles).mockResolvedValue([{ id: 7, title: 'Fajas ceda', image: null }] as never)
    vi.mocked(getArticleVariants).mockResolvedValue([{ id: 1, articleId: 7, size: 'M', sizeId: 1, price: 25 }] as never)
    expect(await source('productos').search('fajas', rutasPermitidas(['admin']))).toEqual([
      { id: 7, titulo: 'Fajas ceda', detalle: 'Tallas: M', ruta: '/catalogo/productos?buscar=Fajas+ceda' },
    ])
    expect(getPosArticles).not.toHaveBeenCalled()
  })

  it('ventas: numero, cliente, saldo y abre el historial en el dia de la venta', async () => {
    vi.mocked(searchVentas).mockResolvedValue([
      { id: 123, fecha: '2026-11-20T15:30:00', total: 150, saldo: 50, estado: 'PENDIENTE', cliente_info: { nombre_completo: 'Sheny' } },
    ] as never)
    const [venta] = await source('ventas').search('123', new Set())
    expect(searchVentas).toHaveBeenCalledWith('123', MAX_RESULTS)
    expect(venta).toMatchObject({
      titulo: '#123 · Sheny',
      detalle: expect.stringMatching(/^2026-11-20 · .*150\.00 · pendiente$/),
      aviso: expect.stringMatching(/^Saldo .*50\.00/),
      ruta: '/venta/historial?buscar=123&fecha_desde=2026-11-20&fecha_hasta=2026-11-20',
    })
  })

  it('usuarios: filtra por nombre o usuario sin acentos y marca los inactivos', async () => {
    vi.mocked(getUsuarios).mockResolvedValue([
      { id: 1, fullName: 'Henry Méndez', username: 'henry', role: 'vendedor', is_active: true },
      { id: 2, fullName: 'Ana Lopez', username: 'ana', role: 'admin', is_active: false },
    ] as never)
    expect(await source('usuarios').search('mendez', new Set())).toEqual([
      { id: 1, titulo: 'Henry Méndez', detalle: 'henry · vendedor', aviso: undefined, ruta: '/administracion/usuarios?buscar=henry' },
    ])
    expect(await source('usuarios').search('ana', new Set())).toMatchObject([{ aviso: 'Inactivo' }])
  })
})

describe('preferencias por usuario', () => {
  beforeEach(() => useQuickSearchPrefs.setState({ ocultos: {} }))

  it('por defecto no oculta nada; oculta y muestra por usuario, y restablece', () => {
    const { setVisible, restablecer } = useQuickSearchPrefs.getState()
    setVisible(1, 'usuarios', false)
    setVisible(1, 'ventas', false)
    setVisible(2, 'clientes', false)
    expect(useQuickSearchPrefs.getState().ocultos).toEqual({ 1: ['usuarios', 'ventas'], 2: ['clientes'] })
    setVisible(1, 'ventas', true)
    expect(useQuickSearchPrefs.getState().ocultos[1]).toEqual(['usuarios'])
    restablecer(1)
    expect(useQuickSearchPrefs.getState().ocultos).toEqual({ 2: ['clientes'] })
  })
})
