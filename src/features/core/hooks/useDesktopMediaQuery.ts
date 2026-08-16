import { useMediaQuery } from "./useMediaQuery"


/** Indica si el viewport actual cae en los breakpoints de tablet (≥768px) y desktop (≥1024px). */
export function useDesktopMediaQuery() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const isTablet = useMediaQuery('(min-width: 768px)')

    return {
        isTablet,
        isDesktop,
    }
}
