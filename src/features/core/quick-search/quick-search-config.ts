import { Users, type LucideIcon } from 'lucide-react'

import type { AppRole } from '@/features/auth/types/auth'
import { getCatalogRoutes } from '@/features/agent/route-catalog'
import { getClientes } from '@/features/customers/services/clientes-service'
import { formatCurrency } from '@/helpers/money'
import { allFeatureRoutes } from '@/routes/feature-routes'

/** Un resultado de la búsqueda rápida: lo que se muestra y a dónde lleva al tocarlo. */
export type QuickSearchResult = {
  id: number
  titulo: string
  detalle?: string
  /** Dato a resaltar (p. ej. la deuda del cliente). */
  aviso?: string
  ruta: string
}

export type QuickSearchSourceId = 'clientes' | 'productos' | 'usuarios'

export type QuickSearchSource = {
  id: QuickSearchSourceId
  label: string
  placeholder: string
  icon: LucideIcon
  /** Ruta del menú que da acceso: el acceso solo se muestra si el rol puede abrirla. */
  ruta: string
  search: (texto: string) => Promise<QuickSearchResult[]>
}

/** Máximo de resultados por búsqueda. */
export const MAX_RESULTS = 10
/** Letras mínimas para buscar. */
export const MIN_CHARS = 2

export const QUICK_SEARCH_SOURCES: QuickSearchSource[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    placeholder: 'Buscar cliente por nombre...',
    icon: Users,
    ruta: '/clientes/listado',
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
]

/** Accesos que el rol puede usar, con los mismos permisos que el menú. */
export function sourcesForPermissions(permissions: AppRole[]): QuickSearchSource[] {
  const allowed = new Set(getCatalogRoutes(allFeatureRoutes, permissions).map((route) => route.path))
  return QUICK_SEARCH_SOURCES.filter((source) => allowed.has(source.ruta))
}
