import { useMediaQuery } from '@/hooks/useMediaQuery'

/**
 * Para calcular el tamaño de pantalla segun dispositivos
 * @returns objetos para saber si esta en el rango > 
 */
export function useDesktopMediaQuery() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const isTablet = useMediaQuery('(min-width: 768px)')

    return {
        isTablet,
        isDesktop,
    }
}
