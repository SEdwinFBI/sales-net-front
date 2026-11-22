import { create } from 'zustand'

export type MicPermissionStatus =
  | 'unknown'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'paused_for_speech'
  | 'unsupported'
  | 'error'

export type SpeechSource = 'agent' | 'cart'

type YieldHandler = () => Promise<void>
type ResumeHandler = () => void
type PromptTrigger = (() => void) | null

let registeredYield: YieldHandler | null = null
let registeredResume: ResumeHandler | null = null
let activeYieldPromise: Promise<void> | null = null

export function registerLiveAudioHandlers(handlers: {
  onYield: YieldHandler
  onResume: ResumeHandler
}) {
  registeredYield = handlers.onYield
  registeredResume = handlers.onResume
}

export function unregisterLiveAudioHandlers() {
  registeredYield = null
  registeredResume = null
  activeYieldPromise = null
}

async function runYield(): Promise<void> {
  if (!registeredYield) return
  if (!activeYieldPromise) {
    activeYieldPromise = Promise.resolve()
      .then(() => registeredYield?.())
      .finally(() => {
        activeYieldPromise = null
      })
  }
  await activeYieldPromise
}

type MicTelemetryUpdate = {
  micStatus?: MicPermissionStatus
  micDetail?: string | null
  isStreamingToAdmin?: boolean
  speaking?: boolean
}

type MicArbitratorState = {
  speechHolders: number
  speechReason: SpeechSource | null
  liveYielded: boolean
  micStatus: MicPermissionStatus
  micDetail: string | null
  isStreamingToAdmin: boolean
  speaking: boolean
  promptTrigger: PromptTrigger
  acquireSpeechMic: (source: SpeechSource, yieldLive: boolean) => Promise<void>
  requestYieldNow: (source: SpeechSource) => Promise<void>
  releaseSpeechMic: () => void
  setMicTelemetry: (update: MicTelemetryUpdate) => void
  setPromptTrigger: (trigger: PromptTrigger) => void
  resetTelemetry: () => void
}

/**
 * Coordina el micrófono físico en móvil entre el audio en vivo para admin
 * y SpeechRecognition (Agente IA / Carrito), evitando capturas mudas.
 */
export const useMicArbitratorStore = create<MicArbitratorState>((set, get) => ({
  speechHolders: 0,
  speechReason: null,
  liveYielded: false,
  micStatus: 'unknown',
  micDetail: null,
  isStreamingToAdmin: false,
  speaking: false,
  promptTrigger: null,

  acquireSpeechMic: async (source, yieldLive) => {
    set((state) => ({
      speechHolders: state.speechHolders + 1,
      speechReason: source,
      liveYielded: state.liveYielded || (yieldLive && registeredYield !== null),
    }))
    if (yieldLive) {
      await runYield()
    }
  },

  requestYieldNow: async (source) => {
    if (!registeredYield) return
    set((state) => ({
      speechReason: state.speechReason ?? source,
      liveYielded: true,
    }))
    await runYield()
  },

  releaseSpeechMic: () => {
    const state = get()
    if (state.speechHolders <= 0) return

    const nextHolders = state.speechHolders - 1
    if (nextHolders > 0) {
      set({ speechHolders: nextHolders })
      return
    }

    const shouldResume = state.liveYielded
    set({
      speechHolders: 0,
      speechReason: null,
      liveYielded: false,
    })

    if (shouldResume) {
      registeredResume?.()
    }
  },

  setMicTelemetry: (update) =>
    set((state) => {
      const nextStatus = update.micStatus ?? state.micStatus
      const nextDetail = update.micDetail !== undefined ? update.micDetail : state.micDetail
      const nextStreaming = update.isStreamingToAdmin ?? state.isStreamingToAdmin
      const nextSpeaking = update.speaking ?? state.speaking

      if (
        nextStatus === state.micStatus &&
        nextDetail === state.micDetail &&
        nextStreaming === state.isStreamingToAdmin &&
        nextSpeaking === state.speaking
      ) {
        return state
      }

      return {
        micStatus: nextStatus,
        micDetail: nextDetail,
        isStreamingToAdmin: nextStreaming,
        speaking: nextSpeaking,
      }
    }),

  setPromptTrigger: (trigger) => set({ promptTrigger: trigger }),

  resetTelemetry: () =>
    set({
      speechHolders: 0,
      speechReason: null,
      liveYielded: false,
      micStatus: 'unknown',
      micDetail: null,
      isStreamingToAdmin: false,
      speaking: false,
      promptTrigger: null,
    }),
}))
