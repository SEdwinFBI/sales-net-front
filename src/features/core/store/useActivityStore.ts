import { create } from 'zustand'

export type ActivityEntityType = 'cliente' | 'sucursal' | null

export type ScreenActivityContext = {
  entityType: ActivityEntityType
  entityId: number | null
  entityLabel: string | null
  detail: string | null
}

type ActivityStoreState = ScreenActivityContext & {
  setScreenContext: (ctx: ScreenActivityContext) => void
  clearScreenContext: () => void
}

const EMPTY_CONTEXT: ScreenActivityContext = {
  entityType: null,
  entityId: null,
  entityLabel: null,
  detail: null,
}

/** Contexto efímero de la pantalla actual (cliente abierto, pestaña o diálogo) para auditoría en vivo. */
export const useActivityStore = create<ActivityStoreState>((set) => ({
  ...EMPTY_CONTEXT,

  setScreenContext: (ctx) =>
    set((state) => {
      if (
        state.entityType === ctx.entityType &&
        state.entityId === ctx.entityId &&
        state.entityLabel === ctx.entityLabel &&
        state.detail === ctx.detail
      ) {
        return state
      }
      return ctx
    }),

  clearScreenContext: () =>
    set((state) => {
      if (
        state.entityType === null &&
        state.entityId === null &&
        state.entityLabel === null &&
        state.detail === null
      ) {
        return state
      }
      return EMPTY_CONTEXT
    }),
}))
