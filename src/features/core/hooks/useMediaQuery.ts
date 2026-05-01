import { useSyncExternalStore } from 'react'

/**
 * Para el calculo dinamico de pantalla
 * @param query texto tipo css 
 * @returns {boolean} si esta en el rango esperado
 * @example const isDesktop = useMediaQuery('(min-width: 1024px)')
 */
export function useMediaQuery(query: string) {
  const subscribe = (onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener('change', onStoreChange)

    return () => mediaQuery.removeEventListener('change', onStoreChange)
  }

  const getSnapshot = () => window.matchMedia(query).matches

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  )
}
