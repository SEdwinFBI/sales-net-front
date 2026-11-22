import { Contact, Package, Receipt, UserCog, type LucideIcon } from 'lucide-react'

import type { AppRole } from '@/features/auth/types/auth'
import { searchCatalogArticles } from '@/features/agent/catalog-search'
import { getCatalogRoutes } from '@/features/agent/route-catalog'
import { fold } from '@/features/agent/tool-helpers'
import { getUsuarios } from '@/features/admin/users/services/usuarios-service'
import { getArticleVariants } from '@/features/catalog/services/article-variants-service'
import { getArticles as getCatalogArticles } from '@/features/catalog/services/articles-service'
import { getClientes } from '@/features/customers/services/clientes-service'
import { getArticles as getPosArticles, searchVentas } from '@/features/sales/services/products-service'
import { formatCurrency } from '@/helpers/money'
import { allFeatureRoutes } from '@/routes/feature-routes'

import { BUSCAR_PARAM } from './useBuscarParam'

/** Un resultado de la búsqueda rápida: lo que se muestra y a dónde lleva al tocarlo. */
export type QuickSearchResult = {
  id: number
  titulo: string
  detalle?: string
  /** Dato a resaltar en rojo (deuda, saldo pendiente, sin stock). */
  aviso?: string
  ruta: string
}

export type QuickSearchSourceId = 'clientes' | 'productos' | 'ventas' | 'usuarios'

export type QuickSearchSource = {
  id: QuickSearchSourceId
  label: string
  /** Una línea para la pantalla de Configuración. */
  descripcion: string
  placeholder: string
  icon: LucideIcon
  /** Si el rol puede usarlo, según las rutas del menú que puede abrir. */
  isAvailable: (rutas: ReadonlySet<string>) => boolean
  search: (texto: string, rutas: ReadonlySet<string>) => Promise<QuickSearchResult[]>
}

/** Máximo de resultados por búsqueda. */
export const MAX_RESULTS = 10
/** Letras mínimas para buscar. */
export const MIN_CHARS = 2

const POS_PATH = '/venta/punto-de-venta'
const CATALOGO_PATH = '/catalogo/productos'

const conBusqueda = (ruta: string, texto: string, extra: Record<string, string> = {}) =>
  `${ruta}?${new URLSearchParams({ [BUSCAR_PARAM]: texto, ...extra })}`

/** Fecha local AAAA-MM-DD (el historial filtra por día local). */
function fechaLocal(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const QUICK_SEARCH_SOURCES: QuickSearchSource[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    descripcion: 'Nombre, telefono y deuda. Abre su ficha.',
    placeholder: 'Buscar cliente por nombre...',
    icon: Contact,
    isAvailable: (rutas) => rutas.has('/clientes/listado'),
    search: async (texto) => {
      const { results } = await getClientes(1, MAX_RESULTS, texto, true)
      return results.map((cliente) => {
        const saldo = Number(cliente.balance) || 0
        return {
          id: cliente.id,
          titulo: cliente.nombre_completo,
          detalle: cliente.telefono || undefined,
          aviso: saldo > 0 ? `Debe ${formatCurrency(saldo)}` : undefined,
          ruta: `/clientes/listado/${cliente.id}`,
        }
      })
    },
  },
  {
    id: 'productos',
    label: 'Productos',
    descripcion: 'Precio y tallas. Abre el producto ya buscado.',
    placeholder: 'Buscar producto por nombre...',
    icon: Package,
    isAvailable: (rutas) => rutas.has(POS_PATH) || rutas.has(CATALOGO_PATH),
    search: async (texto, rutas) => {
      // Con punto de venta: sus productos, con stock. Sin el (admin): el catalogo.
      if (rutas.has(POS_PATH)) {
        const { data } = await getPosArticles(1, MAX_RESULTS, texto)
        return data.map((producto) => {
          const stock = producto.variants.reduce((total, v) => total + v.stock, 0)
          const precio = Math.min(...producto.variants.map((v) => v.price))
          return {
            id: producto.id,
            titulo: producto.name,
            detalle: [Number.isFinite(precio) ? `Desde ${formatCurrency(precio)}` : null, stock > 0 ? `${stock} uds` : null]
              .filter(Boolean)
              .join(' · ') || undefined,
            aviso: stock > 0 ? undefined : 'Sin stock',
            ruta: conBusqueda(POS_PATH, producto.name),
          }
        })
      }
      const [articulos, variantes] = await Promise.all([getCatalogArticles(), getArticleVariants()])
      return searchCatalogArticles(articulos, variantes, texto, MAX_RESULTS).map((articulo) => ({
        id: articulo.id,
        titulo: articulo.nombre,
        detalle: articulo.variantes.length
          ? `Tallas: ${articulo.variantes.map((v) => v.talla).join(', ')}`
          : 'Sin tallas',
        ruta: conBusqueda(CATALOGO_PATH, articulo.nombre),
      }))
    },
  },
  {
    id: 'ventas',
    label: 'Ventas',
    descripcion: 'Por numero o cliente. Abre la venta en el historial.',
    placeholder: 'Numero de venta o cliente...',
    icon: Receipt,
    isAvailable: (rutas) => rutas.has('/venta/historial'),
    search: async (texto) => {
      const ventas = await searchVentas(texto, MAX_RESULTS)
      return ventas.map((venta) => {
        const dia = fechaLocal(venta.fecha)
        const saldo = Number(venta.saldo) || 0
        return {
          id: venta.id,
          titulo: `#${venta.id} · ${venta.cliente_info.nombre_completo}`,
          detalle: `${dia} · ${formatCurrency(Number(venta.total) || 0)} · ${venta.estado.toLowerCase()}`,
          aviso: saldo > 0 ? `Saldo ${formatCurrency(saldo)}` : undefined,
          ruta: conBusqueda('/venta/historial', String(venta.id), { fecha_desde: dia, fecha_hasta: dia }),
        }
      })
    },
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    descripcion: 'Nombre o usuario. Abre la lista ya filtrada.',
    placeholder: 'Buscar usuario por nombre...',
    icon: UserCog,
    isAvailable: (rutas) => rutas.has('/administracion/usuarios'),
    search: async (texto) => {
      const buscado = fold(texto)
      const usuarios = await getUsuarios()
      return usuarios
        .filter((u) => fold(`${u.fullName} ${u.username}`).includes(buscado))
        .slice(0, MAX_RESULTS)
        .map((u) => ({
          id: u.id,
          titulo: u.fullName || u.username,
          detalle: [u.username, u.role].filter(Boolean).join(' · '),
          aviso: u.is_active ? undefined : 'Inactivo',
          ruta: conBusqueda('/administracion/usuarios', u.username),
        }))
    },
  },
]

/** Rutas del menú que el rol puede abrir. */
export function rutasPermitidas(permissions: AppRole[]): ReadonlySet<string> {
  return new Set(getCatalogRoutes(allFeatureRoutes, permissions).map((route) => route.path))
}

/** Accesos que el rol puede usar, con los mismos permisos que el menú. */
export function sourcesForPermissions(permissions: AppRole[]): QuickSearchSource[] {
  const rutas = rutasPermitidas(permissions)
  return QUICK_SEARCH_SOURCES.filter((source) => source.isAvailable(rutas))
}
