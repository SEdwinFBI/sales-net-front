import { useMemo } from 'react'

import type { User } from '@/features/auth/types/auth'

import { QUICK_SEARCH_SOURCES, rutasPermitidas } from './quick-search-config'
import { useOcultos } from './quick-search-prefs'

/**
 * Accesos de búsqueda rápida del usuario: `disponibles` (los que su rol permite, para
 * Configuración) y `visibles` (los disponibles que no ocultó, para el encabezado).
 */
export function useQuickSearchSources(user: Pick<User, 'id' | 'permissions'>) {
  const rutas = useMemo(() => rutasPermitidas(user.permissions), [user.permissions])
  const disponibles = useMemo(() => QUICK_SEARCH_SOURCES.filter((source) => source.isAvailable(rutas)), [rutas])
  const ocultos = useOcultos(user.id)
  const visibles = useMemo(() => disponibles.filter((source) => !ocultos.includes(source.id)), [disponibles, ocultos])
  return { rutas, disponibles, visibles }
}
