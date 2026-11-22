import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  registerLiveAudioHandlers,
  unregisterLiveAudioHandlers,
  useMicArbitratorStore,
} from './useMicArbitratorStore'

describe('useMicArbitratorStore', () => {
  beforeEach(() => {
    unregisterLiveAudioHandlers()
    useMicArbitratorStore.getState().resetTelemetry()
  })

  it('cede el micrófono al speech solo cuando yieldLive=true y lo reanuda al liberar', async () => {
    const onYield = vi.fn(async () => {})
    const onResume = vi.fn()
    registerLiveAudioHandlers({ onYield, onResume })

    await useMicArbitratorStore.getState().acquireSpeechMic('agent', true)
    expect(onYield).toHaveBeenCalledTimes(1)
    expect(onResume).not.toHaveBeenCalled()
    expect(useMicArbitratorStore.getState().speechHolders).toBe(1)
    expect(useMicArbitratorStore.getState().speechReason).toBe('agent')

    useMicArbitratorStore.getState().releaseSpeechMic()
    expect(onResume).toHaveBeenCalledTimes(1)
    expect(useMicArbitratorStore.getState().speechHolders).toBe(0)
    expect(useMicArbitratorStore.getState().speechReason).toBeNull()
  })

  it('no pausa el audio en vivo en escritorio cuando yieldLive=false salvo fallback explícito', async () => {
    const onYield = vi.fn(async () => {})
    const onResume = vi.fn()
    registerLiveAudioHandlers({ onYield, onResume })

    await useMicArbitratorStore.getState().acquireSpeechMic('agent', false)
    expect(onYield).not.toHaveBeenCalled()

    await useMicArbitratorStore.getState().requestYieldNow('agent')
    expect(onYield).toHaveBeenCalledTimes(1)

    useMicArbitratorStore.getState().releaseSpeechMic()
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('soporta múltiples holders sin reanudar antes de que libere el último', async () => {
    const onYield = vi.fn(async () => {})
    const onResume = vi.fn()
    registerLiveAudioHandlers({ onYield, onResume })

    await useMicArbitratorStore.getState().acquireSpeechMic('cart', true)
    await useMicArbitratorStore.getState().acquireSpeechMic('agent', true)
    expect(useMicArbitratorStore.getState().speechHolders).toBe(2)

    useMicArbitratorStore.getState().releaseSpeechMic()
    expect(onResume).not.toHaveBeenCalled()

    useMicArbitratorStore.getState().releaseSpeechMic()
    expect(onResume).toHaveBeenCalledTimes(1)
  })
})
