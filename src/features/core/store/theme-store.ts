import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleTheme: () => {
        get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Aplica el tema persistido sobre <html> al arrancar la app.
 * Debe llamarse antes del primer render para evitar el destello claro.
 */
export function initTheme() {
  applyTheme(useThemeStore.getState().theme)
}
