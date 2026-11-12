import { beforeEach, describe, expect, it } from 'vitest'
import { useAgentStore } from './useAgentStore'

const store = () => useAgentStore.getState()

beforeEach(() => {
  store().cancelConfirmation()
})

describe('confirmación del usuario', () => {
  it('muestra la confirmación pendiente y se resuelve true solo con resolveConfirm(id, true)', async () => {
    const answer = store().requestConfirmation('¿Cerrar la sesión?')
    const pending = store().pendingConfirm
    expect(pending).toMatchObject({ texto: '¿Cerrar la sesión?' })

    store().resolveConfirm(pending!.id, true)
    expect(await answer).toBe(true)
    expect(store().pendingConfirm).toBeNull()
  })

  it('cancelar la resuelve en false', async () => {
    const answer = store().requestConfirmation('¿Quitar a Juan?')
    store().resolveConfirm(store().pendingConfirm!.id, false)
    expect(await answer).toBe(false)
  })

  it('cancelConfirmation (widget cerrado o socket caído) la resuelve en false', async () => {
    const answer = store().requestConfirmation('¿Seguro?')
    store().cancelConfirmation()
    expect(await answer).toBe(false)
    expect(store().pendingConfirm).toBeNull()
  })

  it('una segunda petición cancela la anterior: solo hay una a la vez', async () => {
    const first = store().requestConfirmation('primera')
    const second = store().requestConfirmation('segunda')

    expect(await first).toBe(false)
    expect(store().pendingConfirm?.texto).toBe('segunda')
    store().resolveConfirm(store().pendingConfirm!.id, true)
    expect(await second).toBe(true)
  })

  it('un id viejo o desconocido no confirma nada', async () => {
    const first = store().requestConfirmation('primera')
    const staleId = store().pendingConfirm!.id
    const second = store().requestConfirmation('segunda')
    await first

    store().resolveConfirm(staleId, true) // id de la primera, ya cancelada
    store().resolveConfirm(9999, true) // id que nunca existió
    expect(store().pendingConfirm?.texto).toBe('segunda')

    store().cancelConfirmation()
    expect(await second).toBe(false)
  })

  it('no se puede resolver dos veces', async () => {
    const answer = store().requestConfirmation('una vez')
    const { id } = store().pendingConfirm!
    store().resolveConfirm(id, false)
    store().resolveConfirm(id, true)
    expect(await answer).toBe(false)
  })
})
