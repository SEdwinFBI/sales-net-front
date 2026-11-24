import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { QuickSearchSourceId } from './quick-search-config'

type PrefsState = {
  /**
   * Accesos ocultos por id de usuario. Se guardan los ocultos (no los visibles) para que un acceso
   * nuevo aparezca encendido sin que nadie tenga que activarlo.
   */
  ocultos: Record<number, QuickSearchSourceId[]>
  setVisible: (userId: number, id: QuickSearchSourceId, visible: boolean) => void
  restablecer: (userId: number) => void
}

export const useQuickSearchPrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ocultos: {},
      setVisible: (userId, id, visible) =>
        set((state) => {
          const actuales = (state.ocultos[userId] ?? []).filter((oculto) => oculto !== id)
          return { ocultos: { ...state.ocultos, [userId]: visible ? actuales : [...actuales, id] } }
        }),
      restablecer: (userId) =>
        set((state) => {
          const ocultos = { ...state.ocultos }
          delete ocultos[userId]
          return { ocultos }
        }),
    }),
    // Si el navegador no deja guardar (p. ej. modo privado), se usan los valores por defecto.
    { name: 'accesos-directos', storage: createJSONStorage(() => localStorage) },
  ),
)

const SIN_OCULTOS: QuickSearchSourceId[] = []

/** Accesos que el usuario ocultó. */
export const useOcultos = (userId: number) => useQuickSearchPrefs((state) => state.ocultos[userId] ?? SIN_OCULTOS)
