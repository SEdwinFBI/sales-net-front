import { create } from 'zustand'

export type PendingConfirm = { id: number; texto: string }

type AgentStoreState = {
  /** El micrófono del agente está abierto: el dictado del carrito debe callar. */
  listening: boolean
  setListening: (listening: boolean) => void
  /** Confirmación pendiente: tarjeta «Confirmar / Cancelar» en el widget. */
  pendingConfirm: PendingConfirm | null
  /**
   * Pide al usuario que confirme una acción. Solo `resolveConfirm(id, true)` (el clic en el
   * botón del widget) la aprueba; el modelo y la voz no tienen forma de hacerlo.
   */
  requestConfirmation: (texto: string) => Promise<boolean>
  resolveConfirm: (id: number, ok: boolean) => void
  /** Cancela la confirmación pendiente (widget cerrado o socket desconectado). */
  cancelConfirmation: () => void
}

// Los resolvers no se guardan en el estado de zustand: no son datos serializables ni deben re-renderizar.
const resolvers = new Map<number, (ok: boolean) => void>()
let nextConfirmId = 1

/** Estado efímero compartido entre el widget y el resto de la app (nunca se persiste). */
export const useAgentStore = create<AgentStoreState>((set, get) => ({
  listening: false,
  setListening: (listening) => set({ listening }),

  pendingConfirm: null,

  requestConfirmation: (texto) => {
    // Una sola confirmación a la vez: la anterior se da por cancelada.
    get().cancelConfirmation()
    const id = nextConfirmId++
    return new Promise<boolean>((resolve) => {
      resolvers.set(id, resolve)
      set({ pendingConfirm: { id, texto } })
    })
  },

  resolveConfirm: (id, ok) => {
    const resolve = resolvers.get(id)
    if (!resolve) return
    resolvers.delete(id)
    set((state) => (state.pendingConfirm?.id === id ? { pendingConfirm: null } : state))
    resolve(ok)
  },

  cancelConfirmation: () => {
    const pending = get().pendingConfirm
    if (pending) get().resolveConfirm(pending.id, false)
  },
}))
