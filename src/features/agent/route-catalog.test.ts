import { describe, expect, it } from 'vitest'
import type { AppRoute } from '@/lib/app-routes'
import { allFeatureRoutes } from '@/routes/feature-routes'
import { getCatalogRoutes, getListedRoutes, resolveNavigation } from './route-catalog'

const lazy = async () => ({ default: () => null })

const routes: AppRoute[] = [
  {
    path: 'reportes',
    meta: { name: 'Reportes' },
    children: [{ path: 'dashboard', meta: { name: 'Dashboard', permissions: ['admin'], lazy } }],
  },
  {
    path: 'clientes',
    meta: { name: 'Clientes' },
    children: [
      { path: 'listado', meta: { name: 'Lista', permissions: ['admin', 'vendedor'], lazy } },
      { path: 'listado/:id', meta: { name: 'Detalle', permissions: ['admin', 'vendedor'], lazy, hideFromSidebar: true } },
    ],
  },
  {
    path: 'administracion',
    meta: { name: 'Admin' },
    children: [{ path: 'sucursales/:id', meta: { name: 'Sucursal', permissions: ['admin'], lazy } }],
  },
]

describe('catálogo de rutas del agente', () => {
  it('filtra por permisos del usuario y arma el path completo', () => {
    const paths = (perms: Parameters<typeof getCatalogRoutes>[1]) =>
      getCatalogRoutes(routes, perms).map((r) => r.path)

    expect(paths(['vendedor'])).toEqual(['/clientes/listado', '/clientes/listado/:id'])
    expect(paths(['admin'])).toContain('/reportes/dashboard')
  })

  it('describe al modelo las rutas sin parámetros y, como plantilla, las de detalle de cliente', () => {
    const listed = getListedRoutes(getCatalogRoutes(routes, ['admin']))
    expect(listed).toEqual([
      { path: '/reportes/dashboard', name: 'Dashboard' },
      { path: '/clientes/listado', name: 'Lista' },
      { path: '/clientes/listado/{id}', name: 'Detalle', plantilla: true },
    ])
  })

  it('con las rutas reales incluye las fichas de cliente como plantilla y excluye otros :id', () => {
    const listed = getListedRoutes(getCatalogRoutes(allFeatureRoutes, ['admin']))
    const plantillas = listed.filter((r) => r.plantilla)

    expect(plantillas.map((r) => r.path)).toEqual(['/clientes/listado/{id}', '/clientes/listado/{id}/precios'])
    expect(listed.some((r) => r.path.includes(':'))).toBe(false)
    // /administracion/sucursales/:id no se lista (navegar la rechaza); el listado /administracion/sucursales sí.
    expect(listed.some((r) => r.path.startsWith('/administracion/sucursales/'))).toBe(false)
    expect(listed.filter((r) => !r.plantilla).every((r) => !r.path.includes('{'))).toBe(true)
  })

  it('describe al modelo lo que ofrece cada pantalla (acciones), también en las plantillas {id}', () => {
    const conHint: AppRoute[] = [
      {
        path: 'clientes',
        meta: { name: 'Clientes' },
        children: [
          { path: 'listado', meta: { name: 'Lista', agentHint: 'Lista de clientes: buscar.', permissions: ['admin'], lazy } },
          { path: 'listado/:id', meta: { name: 'Detalle', agentHint: 'Ficha del cliente: registrar venta.', permissions: ['admin'], lazy } },
          { path: 'otra', meta: { name: 'Sin pista', permissions: ['admin'], lazy } },
        ],
      },
    ]
    expect(getListedRoutes(getCatalogRoutes(conHint, ['admin']))).toEqual([
      { path: '/clientes/listado', name: 'Lista', acciones: 'Lista de clientes: buscar.' },
      { path: '/clientes/listado/{id}', name: 'Detalle', acciones: 'Ficha del cliente: registrar venta.', plantilla: true },
      { path: '/clientes/otra', name: 'Sin pista' },
    ])
  })

  it.each([['admin'], ['vendedor']] as const)('con las rutas reales, toda ruta del catálogo de %s tiene agentHint de 1 a 160 caracteres', (role) => {
    const catalog = getCatalogRoutes(allFeatureRoutes, [role])
    expect(catalog.length).toBeGreaterThan(5)
    for (const route of catalog) {
      expect(route.agentHint?.trim(), route.path).toBeTruthy()
      expect(route.agentHint!.length, route.path).toBeLessThanOrEqual(160)
    }
    // Todas las rutas listadas al modelo llevan `acciones`.
    for (const listed of getListedRoutes(catalog)) expect(listed.acciones, listed.path).toBeTruthy()
  })

  it('las rutas con credenciales solo se navegan: su pista lo dice', () => {
    const catalog = getCatalogRoutes(allFeatureRoutes, ['admin'])
    for (const path of ['/administracion/passkeys', '/administracion/patron-acceso']) {
      expect(catalog.find((r) => r.path === path)?.agentHint).toMatch(/Solo navegar/)
    }
  })

  it('la lista de rutas con acciones cabe de sobra en el contexto del agente (10000 caracteres)', () => {
    for (const role of ['admin', 'vendedor'] as const) {
      const size = JSON.stringify(getListedRoutes(getCatalogRoutes(allFeatureRoutes, [role]))).length
      expect(size, role).toBeLessThan(6500)
    }
  })

  it('con las rutas reales, el vendedor no ve el dashboard y sí el punto de venta', () => {
    const paths = getCatalogRoutes(allFeatureRoutes, ['vendedor']).map((r) => r.path)
    expect(paths).toContain('/venta/punto-de-venta')
    expect(paths).not.toContain('/reportes/dashboard')
  })

  describe('resolveNavigation', () => {
    const catalog = getCatalogRoutes(routes, ['vendedor'])
    const known = new Set([12])

    it('acepta una ruta del catálogo (y tolera la barra final)', () => {
      expect(resolveNavigation('/clientes/listado/', catalog, known)).toEqual({ ok: true, path: '/clientes/listado' })
    })

    it('rechaza rutas fuera del catálogo permitido', () => {
      expect(resolveNavigation('/reportes/dashboard', catalog, known).ok).toBe(false)
      expect(resolveNavigation('/no-existe', catalog, known).ok).toBe(false)
    })

    it('rechaza entradas raras', () => {
      for (const bad of [42, null, '', 'clientes/listado', '/clientes/listado?x=1', '/clientes/listado#a', '//evil.com']) {
        expect(resolveNavigation(bad, catalog, known).ok).toBe(false)
      }
    })

    it('las rutas con :id exigen un id de cliente que el agente haya buscado', () => {
      expect(resolveNavigation('/clientes/listado/12', catalog, known)).toEqual({ ok: true, path: '/clientes/listado/12' })
      expect(resolveNavigation('/clientes/listado/99', catalog, known).ok).toBe(false)
      expect(resolveNavigation('/clientes/listado/abc', catalog, known).ok).toBe(false)
    })

    it('un id de cliente no sirve para rutas :id de otras secciones', () => {
      const admin = getCatalogRoutes(routes, ['admin'])
      expect(resolveNavigation('/administracion/sucursales/12', admin, known).ok).toBe(false)
    })
  })
})
