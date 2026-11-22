import { useEffect } from 'react'
import { buildWsUrl } from '@/lib/api'
import { useAuthStore } from '@/features/core/store/auth-store'
import {
  registerLiveAudioHandlers,
  unregisterLiveAudioHandlers,
  useMicArbitratorStore,
  type MicPermissionStatus,
} from '@/features/core/store/useMicArbitratorStore'
import { createPcmCapture, type PcmCaptureController } from '../audio/pcm-capture'

const RECONNECT_DELAY_MS = 3000
const PING_INTERVAL_MS = 10000

function isLocalSecureHost(): boolean {
  const hn = window.location.hostname
  return hn === 'localhost' || hn === '127.0.0.1'
}

async function queryMicrophonePermission(): Promise<PermissionState | null> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return null
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return status.state
  } catch {
    return null
  }
}

/**
 * Mantiene listo el micrófono del vendedor desde que inicia sesión y transmite
 * PCM efímero solo mientras un administrador está escuchando su canal.
 */
export function useSellerLiveAudio() {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.user?.role)
  // Solo transmite si el admin le encendio la transmision de audio.
  const permitido = useAuthStore((state) => state.user?.transmision_audio === true)

  useEffect(() => {
    if (!token || role !== 'vendedor' || !permitido) {
      useMicArbitratorStore.getState().resetTelemetry()
      return
    }

    if (
      typeof window === 'undefined' ||
      (!window.isSecureContext && !isLocalSecureHost()) ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      useMicArbitratorStore.getState().setMicTelemetry({
        micStatus: 'unsupported',
        micDetail: window.isSecureContext ? 'Sin soporte de audio' : 'Requiere HTTPS',
        isStreamingToAdmin: false,
        speaking: false,
      })
      return
    }

    let disposed = false
    let ws: WebSocket | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let capture: PcmCaptureController | null = null
    let activeStream: MediaStream | null = null
    let streamingRequested = false
    let yielded = false
    let acquiring = false
    let permissionHandle: PermissionStatus | null = null
    let detachGestureRetry: (() => void) | null = null

    const pushStatus = (
      micStatus: MicPermissionStatus,
      micDetail: string | null = null,
      extra?: { speaking?: boolean; isStreamingToAdmin?: boolean },
    ) => {
      if (disposed) return
      useMicArbitratorStore.getState().setMicTelemetry({
        micStatus,
        micDetail,
        speaking: extra?.speaking,
        isStreamingToAdmin: extra?.isStreamingToAdmin,
      })
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'mic.status',
            status: micStatus,
            detail: micDetail,
            ...(extra?.speaking !== undefined ? { speaking: extra.speaking } : {}),
          }),
        )
      }
    }

    const stopCaptureInternal = async (intentionalYield: boolean) => {
      if (intentionalYield) {
        yielded = true
      }
      const currentCapture = capture
      capture = null
      activeStream = null
      if (currentCapture) {
        await currentCapture.stop()
      }
    }

    const clearGestureRetry = () => {
      if (detachGestureRetry) {
        detachGestureRetry()
        detachGestureRetry = null
      }
      useMicArbitratorStore.getState().setPromptTrigger(null)
    }

    const attachGestureRetry = () => {
      if (disposed || detachGestureRetry) return
      const trigger = () => {
        clearGestureRetry()
        void acquireMic()
      }
      const opts = { capture: true, once: true } as const
      window.addEventListener('pointerdown', trigger, opts)
      window.addEventListener('keydown', trigger, opts)
      detachGestureRetry = () => {
        window.removeEventListener('pointerdown', trigger, { capture: true })
        window.removeEventListener('keydown', trigger, { capture: true })
      }
      useMicArbitratorStore.getState().setPromptTrigger(trigger)
    }

    const acquireMic = async () => {
      if (disposed || acquiring || yielded) return
      if (capture && activeStream?.getTracks().some((t) => t.readyState === 'live')) {
        await capture.resume()
        capture.setStreaming(streamingRequested)
        return
      }

      acquiring = true
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        if (disposed || yielded) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        clearGestureRetry()
        activeStream = stream

        const newCapture = await createPcmCapture(stream, {
          onChunk: (buffer) => {
            if (disposed || yielded || !streamingRequested) return
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(buffer)
            }
          },
          onSpeakingChange: (speaking) => {
            if (disposed || yielded) return
            pushStatus('granted', null, { speaking })
          },
        })

        if (disposed || yielded) {
          await newCapture.stop()
          return
        }

        capture = newCapture
        capture.setStreaming(streamingRequested)
        pushStatus('granted', null, {
          speaking: false,
          isStreamingToAdmin: streamingRequested,
        })

        stream.getTracks().forEach((track) => {
          track.onended = () => {
            if (disposed || yielded) return
            void (async () => {
              await stopCaptureInternal(false)
              const perm = await queryMicrophonePermission()
              if (disposed || yielded) return
              if (perm === 'denied') {
                pushStatus('denied', 'Revocado en el navegador', {
                  speaking: false,
                  isStreamingToAdmin: false,
                })
                return
              }
              if (!document.hidden) {
                setTimeout(() => {
                  if (!disposed && !yielded) void acquireMic()
                }, 400)
              }
            })()
          }
        })
      } catch (err: unknown) {
        if (disposed || yielded) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          const perm = await queryMicrophonePermission()
          if (disposed) return
          if (perm === 'prompt') {
            pushStatus('prompt', 'Toca para permitir micrófono', {
              speaking: false,
              isStreamingToAdmin: false,
            })
            attachGestureRetry()
          } else {
            pushStatus('denied', 'Permiso denegado en navegador', {
              speaking: false,
              isStreamingToAdmin: false,
            })
          }
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          pushStatus('error', 'Sin micrófono detectado', {
            speaking: false,
            isStreamingToAdmin: false,
          })
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          pushStatus('error', 'Micrófono ocupado por otra app', {
            speaking: false,
            isStreamingToAdmin: false,
          })
        } else {
          pushStatus('error', 'No se pudo abrir el micrófono', {
            speaking: false,
            isStreamingToAdmin: false,
          })
        }
      } finally {
        acquiring = false
      }
    }

    registerLiveAudioHandlers({
      onYield: async () => {
        if (disposed) return
        const reason = useMicArbitratorStore.getState().speechReason
        await stopCaptureInternal(true)
        pushStatus(
          'paused_for_speech',
          reason === 'cart' ? 'Dictado de carrito' : 'Asistente IA',
          { speaking: false, isStreamingToAdmin: false },
        )
      },
      onResume: () => {
        if (disposed) return
        yielded = false
        void acquireMic()
      },
    })

    const connectWs = () => {
      if (disposed) return
      ws = new WebSocket(buildWsUrl('/ws/audio/broadcast/', token))

      ws.onopen = () => {
        const current = useMicArbitratorStore.getState()
        ws?.send(
          JSON.stringify({
            type: 'mic.status',
            status: current.micStatus,
            detail: current.micDetail,
            speaking: current.speaking,
          }),
        )
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return
        try {
          const data = JSON.parse(event.data) as { type?: string }
          if (data.type === 'stream.start') {
            streamingRequested = true
            capture?.setStreaming(true)
            useMicArbitratorStore.getState().setMicTelemetry({ isStreamingToAdmin: !yielded })
          } else if (data.type === 'stream.stop') {
            streamingRequested = false
            capture?.setStreaming(false)
            useMicArbitratorStore.getState().setMicTelemetry({ isStreamingToAdmin: false })
          }
        } catch {
          /* Ignora mensajes malformados */
        }
      }

      ws.onclose = () => {
        streamingRequested = false
        capture?.setStreaming(false)
        useMicArbitratorStore.getState().setMicTelemetry({ isStreamingToAdmin: false })
        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer)
          heartbeatTimer = null
        }
        if (!disposed) {
          reconnectTimer = setTimeout(connectWs, RECONNECT_DELAY_MS)
        }
      }

      ws.onerror = () => {
        /* onclose gestiona el reintento */
      }
    }

    const setupPermissionWatcher = async () => {
      if (typeof navigator === 'undefined' || !navigator.permissions?.query) return
      try {
        const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        if (disposed) return
        permissionHandle = perm
        perm.onchange = () => {
          if (disposed) return
          if (perm.state === 'denied') {
            clearGestureRetry()
            void stopCaptureInternal(false)
            pushStatus('denied', 'Permiso denegado en navegador', {
              speaking: false,
              isStreamingToAdmin: false,
            })
          } else if (perm.state === 'granted') {
            clearGestureRetry()
            if (!yielded) void acquireMic()
          } else if (perm.state === 'prompt') {
            void stopCaptureInternal(false)
            pushStatus('prompt', 'Toca para permitir micrófono', {
              speaking: false,
              isStreamingToAdmin: false,
            })
            attachGestureRetry()
          }
        }
      } catch {
        /* Safari antiguo no soporta permissions.query para microphone */
      }
    }

    const onVisibilityChange = () => {
      if (disposed || document.hidden || yielded) return
      const liveTrack = activeStream?.getTracks().some((t) => t.readyState === 'live')
      if (!liveTrack && useMicArbitratorStore.getState().micStatus !== 'denied') {
        void acquireMic()
      } else {
        void capture?.resume()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    connectWs()
    void setupPermissionWatcher()
    void acquireMic()

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (permissionHandle) permissionHandle.onchange = null
      clearGestureRetry()
      unregisterLiveAudioHandlers()
      if (heartbeatTimer !== null) clearInterval(heartbeatTimer)
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      ws?.close()
      void stopCaptureInternal(false)
      useMicArbitratorStore.getState().resetTelemetry()
    }
  }, [token, role, permitido])
}
