import { useEffect } from 'react'
import { buildWsUrl } from '@/lib/api'
import { findActiveRouteTrail } from '@/lib/route-trail'
import { allFeatureRoutes } from '@/routes/feature-routes'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useActivityStore } from '@/features/core/store/useActivityStore'
import { useMicArbitratorStore } from '@/features/core/store/useMicArbitratorStore'
import { useAgentStore } from '@/features/agent/store/useAgentStore'
import { useSalesStore } from '@/features/sales/store/useSalesStore'
import { selectTotal, selectTotalItems } from '@/features/sales/utils/utilsSales'

const PING_INTERVAL_MS = 10000
const RECONNECT_DELAY_MS = 3000
const ACTIVITY_DEBOUNCE_MS = 200
const PRESENCE_WS_ENABLED = true

export type RouterObserver = {
  state: { location: { pathname: string } }
  subscribe: (listener: () => void) => () => void
}

function resolveActiveDialog(sales: ReturnType<typeof useSalesStore.getState>): string | null {
  if (sales.branchAvailability.open) return 'existencias-tiendas'
  return sales.activeDialog
}

function buildPresencePayload(router?: RouterObserver) {
  const pathname = router?.state.location.pathname ?? window.location.pathname
  const trail = findActiveRouteTrail(allFeatureRoutes, pathname)
  const section = trail.length > 1 ? trail[0] : null
  const moduleName = trail.at(-1) ?? (pathname === '/' ? 'Inicio' : pathname)

  const user = useAuthStore.getState().user
  const sales = useSalesStore.getState()
  const activityCtx = useActivityStore.getState()
  const agentListening = useAgentStore.getState().listening
  const mic = useMicArbitratorStore.getState()

  return {
    sucursal: user?.sucursalActual?.nombre ?? null,
    activity: {
      route: pathname,
      section,
      module: moduleName,
      detail: activityCtx.detail,
      entity_type: activityCtx.entityType,
      entity_id: activityCtx.entityId,
      entity_label: activityCtx.entityLabel,
      cart_open: sales.cartOpen,
      cart_count: selectTotalItems(sales),
      cart_total: Math.round(selectTotal(sales) * 100) / 100,
      active_dialog: resolveActiveDialog(sales),
      agent_listening: agentListening || mic.speechReason === 'agent',
    },
    mic: {
      status: mic.micStatus,
      detail: mic.micDetail,
      speaking: mic.speaking,
    },
  }
}

function usePresenceSocket(token: string | null, router?: RouterObserver) {
  useEffect(() => {
    if (!token || !PRESENCE_WS_ENABLED) return
    let ws: WebSocket | null = null
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let activityTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false
    let lastActivityJson = ''
    let lastMicJson = ''

    const sendCurrentState = (force = false) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      const payload = buildPresencePayload(router)

      const activityMsg = JSON.stringify({
        type: 'activity.update',
        sucursal: payload.sucursal,
        activity: payload.activity,
      })
      if (force || activityMsg !== lastActivityJson) {
        lastActivityJson = activityMsg
        ws.send(activityMsg)
      }

      const micMsg = JSON.stringify({
        type: 'mic.status',
        status: payload.mic.status,
        detail: payload.mic.detail,
        speaking: payload.mic.speaking,
      })
      if (force || micMsg !== lastMicJson) {
        lastMicJson = micMsg
        ws.send(micMsg)
      }
    }

    const scheduleStateSync = () => {
      if (activityTimer) clearTimeout(activityTimer)
      activityTimer = setTimeout(() => {
        activityTimer = null
        sendCurrentState(false)
      }, ACTIVITY_DEBOUNCE_MS)
    }

    const unsubscribers: Array<() => void> = [
      useSalesStore.subscribe(scheduleStateSync),
      useActivityStore.subscribe(scheduleStateSync),
      useAgentStore.subscribe(scheduleStateSync),
      useAuthStore.subscribe(scheduleStateSync),
      useMicArbitratorStore.subscribe(scheduleStateSync),
    ]
    if (router) {
      unsubscribers.push(router.subscribe(scheduleStateSync))
    }

    function connect() {
      ws = new WebSocket(buildWsUrl('/ws/presence/', token as string))

      ws.onopen = () => {
        sendCurrentState(true)
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = () => {
        // El heartbeat espera {"type": "pong"}; no requiere acción adicional.
      }

      ws.onclose = () => {
        if (heartbeatInterval !== null) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }
        if (!stopped) reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onerror = (e) => {
        console.error('[presence] error:', e)
      }
    }

    connect()
    return () => {
      stopped = true
      if (heartbeatInterval !== null) clearInterval(heartbeatInterval)
      if (reconnectTimeout !== null) clearTimeout(reconnectTimeout)
      if (activityTimer !== null) clearTimeout(activityTimer)
      unsubscribers.forEach((unsub) => unsub())
      ws?.close()
    }
  }, [token, router])
}

export default usePresenceSocket
