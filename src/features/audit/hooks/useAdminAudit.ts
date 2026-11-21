import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { buildWsUrl } from '@/lib/api'
import { parseAudioFrame, PcmAudioPlayer } from '../audio/pcm-player'
import type {
  AuditPresenceUpdateMessage,
  AuditSnapshotMessage,
  AuditUserSummary,
} from '../types/audit-types'

const PING_INTERVAL_MS = 10000
const RECONNECT_DELAY_MS = 3000
const VU_POLL_INTERVAL_MS = 90
const EMPTY_LIVE_USERS = new Map<number, AuditUserSummary>()

export function useAdminAudit(token: string | null) {
  const [liveUsers, setLiveUsers] = useState<Map<number, AuditUserSummary>>(() => new Map())
  const [presenceConnected, setPresenceConnected] = useState(false)
  const [audioConnected, setAudioConnected] = useState(false)
  const [listeningSellerId, setListeningSellerId] = useState<number | null>(null)
  const [volume, setVolumeState] = useState(1)
  const [muted, setMutedState] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const audioWsRef = useRef<WebSocket | null>(null)
  const playerRef = useRef<PcmAudioPlayer | null>(null)
  const listeningSellerRef = useRef<number | null>(null)

  const ensurePlayer = useCallback(async () => {
    if (!playerRef.current) {
      playerRef.current = new PcmAudioPlayer()
    }
    playerRef.current.setVolume(volume)
    playerRef.current.setMuted(muted)
    await playerRef.current.start()
  }, [volume, muted])

  useEffect(() => {
    if (!token) return

    let ws: WebSocket | null = null
    let heartbeat: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const connect = () => {
      if (stopped) return
      ws = new WebSocket(buildWsUrl('/ws/admin/presence/', token))

      ws.onopen = () => {
        setPresenceConnected(true)
        heartbeat = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return
        try {
          const msg = JSON.parse(event.data) as AuditSnapshotMessage | AuditPresenceUpdateMessage | { type: string }
          if (msg.type === 'snapshot') {
            const snap = msg as AuditSnapshotMessage
            const next = new Map<number, AuditUserSummary>()
            if (snap.users) {
              for (const [uidStr, summary] of Object.entries(snap.users)) {
                next.set(Number(uidStr), summary)
              }
            }
            setLiveUsers(next)
            return
          }

          if (msg.type === 'presence.update') {
            const update = msg as AuditPresenceUpdateMessage
            setLiveUsers((prev) => {
              const next = new Map(prev)
              if (update.status === 'online' && update.summary) {
                next.set(update.user_id, update.summary)
              } else {
                next.delete(update.user_id)
              }
              return next
            })
          }
        } catch {
          /* Ignora tramas inválidas */
        }
      }

      ws.onclose = () => {
        setPresenceConnected(false)
        if (heartbeat !== null) {
          clearInterval(heartbeat)
          heartbeat = null
        }
        if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        /* onclose maneja la reconexión */
      }
    }

    connect()
    return () => {
      stopped = true
      setPresenceConnected(false)
      if (heartbeat !== null) clearInterval(heartbeat)
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    let ws: WebSocket | null = null
    let heartbeat: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const connect = () => {
      if (stopped) return
      ws = new WebSocket(buildWsUrl('/ws/admin/audio/', token))
      ws.binaryType = 'arraybuffer'
      audioWsRef.current = ws

      ws.onopen = () => {
        setAudioConnected(true)
        if (listeningSellerRef.current !== null) {
          ws?.send(
            JSON.stringify({
              type: 'listen.start',
              seller_id: listeningSellerRef.current,
              exclusive: true,
            }),
          )
        }
        heartbeat = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const parsed = parseAudioFrame(event.data)
          if (!parsed || parsed.sellerId !== listeningSellerRef.current) return
          playerRef.current?.enqueue(parsed.pcm)
          return
        }

        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data) as { type?: string; seller_id?: number }
            if (msg.type === 'seller.audio_offline' && msg.seller_id === listeningSellerRef.current) {
              listeningSellerRef.current = null
              setListeningSellerId(null)
              setAudioLevel(0)
              void playerRef.current?.stop()
              playerRef.current = null
              toast.info('El vendedor cerró o perdió la conexión de audio')
            }
          } catch {
            /* Ignora tramas inválidas */
          }
        }
      }

      ws.onclose = () => {
        setAudioConnected(false)
        if (audioWsRef.current === ws) {
          audioWsRef.current = null
        }
        if (heartbeat !== null) {
          clearInterval(heartbeat)
          heartbeat = null
        }
        if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = () => {
        /* onclose maneja la reconexión */
      }
    }

    connect()
    return () => {
      stopped = true
      setAudioConnected(false)
      if (heartbeat !== null) clearInterval(heartbeat)
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      if (ws?.readyState === WebSocket.OPEN && listeningSellerRef.current !== null) {
        ws.send(JSON.stringify({ type: 'listen.stop' }))
      }
      ws?.close()
      audioWsRef.current = null
      listeningSellerRef.current = null
      setListeningSellerId(null)
      void playerRef.current?.stop()
      playerRef.current = null
    }
  }, [token])

  useEffect(() => {
    if (listeningSellerId === null) {
      return
    }
    const timer = setInterval(() => {
      setAudioLevel(playerRef.current?.getLevel() ?? 0)
    }, VU_POLL_INTERVAL_MS)
    return () => {
      clearInterval(timer)
      setAudioLevel(0)
    }
  }, [listeningSellerId])

  const startListening = useCallback(
    async (sellerId: number) => {
      const ws = audioWsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        toast.error('El canal de audio aún se está conectando')
        return
      }

      await ensurePlayer()
      playerRef.current?.resetBuffer()

      listeningSellerRef.current = sellerId
      setListeningSellerId(sellerId)
      ws.send(JSON.stringify({ type: 'listen.start', seller_id: sellerId, exclusive: true }))
    },
    [ensurePlayer],
  )

  const stopListening = useCallback(() => {
    const ws = audioWsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'listen.stop' }))
    }
    listeningSellerRef.current = null
    setListeningSellerId(null)
    setAudioLevel(0)
    void playerRef.current?.stop()
    playerRef.current = null
  }, [])

  const setVolume = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(1, next))
    setVolumeState(clamped)
    playerRef.current?.setVolume(clamped)
    if (clamped > 0 && muted) {
      setMutedState(false)
      playerRef.current?.setMuted(false)
    }
  }, [muted])

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev
      playerRef.current?.setMuted(next)
      return next
    })
  }, [])

  const activeToken = Boolean(token)

  return {
    liveUsers: activeToken ? liveUsers : EMPTY_LIVE_USERS,
    presenceConnected: activeToken && presenceConnected,
    audioConnected: activeToken && audioConnected,
    listeningSellerId: activeToken ? listeningSellerId : null,
    volume,
    muted,
    audioLevel: activeToken && listeningSellerId !== null ? audioLevel : 0,
    startListening,
    stopListening,
    setVolume,
    toggleMuted,
  }
}
