import { useCallback, useEffect, useRef, useState } from 'react'
import { buildWsUrl } from '@/lib/api'
import type {
  AgentContext,
  AgentStatus,
  ChatMessage,
  ClientMessage,
  ContextTool,
  ServerMessage,
  ToolResult,
} from '../types'

const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_DELAY_MS = 30000

/** Cierres que el back usa para rechazar: reintentar no los arregla. */
const FATAL_CLOSE_MESSAGES: Record<number, string> = {
  4401: 'Sesión vencida; se reconectará al renovarse.',
  4403: 'No tienes acceso al asistente.',
  4500: 'El asistente no está configurado en el servidor.',
}

const ACTION_LABELS: Record<string, string> = {
  navegar: 'Navegando…',
  leer_estado: 'Revisando la pantalla…',
  buscar_articulos: 'Buscando artículos…',
  agregar_al_carrito: 'Agregando al carrito…',
  cambiar_cantidad: 'Cambiando la cantidad…',
  quitar_item: 'Quitando del carrito…',
  vaciar_carrito: 'Pidiendo confirmación para vaciar…',
  buscar_cliente: 'Buscando cliente…',
  seleccionar_cliente: 'Seleccionando cliente…',
  abrir_carrito: 'Abriendo el carrito…',
  cerrar_carrito: 'Cerrando el carrito…',
  abrir_checkout: 'Abriendo el cobro…',
  cerrar_dialogo: 'Cerrando el diálogo…',
}

/** Etiqueta de las tools de pantalla según su prefijo (las convenciones del manual). */
const PREFIX_LABELS: [string, string][] = [
  ['leer_', 'Leyendo la pantalla…'],
  ['opciones_', 'Leyendo las opciones…'],
  ['filtrar_', 'Aplicando filtros…'],
  ['limpiar_filtros_', 'Quitando filtros…'],
  ['paginar_', 'Revisando la paginación…'],
  ['abrir_', 'Abriendo…'],
  ['ver_', 'Abriendo…'],
  ['cambiar_pestana_', 'Cambiando de pestaña…'],
  ['llenar_', 'Llenando el formulario…'],
  ['editar_', 'Editando el borrador…'],
  ['elegir_', 'Eligiendo…'],
  ['descargar_', 'Descargando…'],
  ['guardar_', 'Esperando tu confirmación…'],
  ['confirmar_', 'Esperando tu confirmación…'],
]

export function actionLabel(name: string): string {
  return ACTION_LABELS[name] ?? PREFIX_LABELS.find(([prefix]) => name.startsWith(prefix))?.[1] ?? 'Ejecutando…'
}

type Options = {
  /** Se conecta solo mientras sea true (el widget lo activa al abrirse por primera vez). */
  enabled: boolean
  /** Access token vigente: al renovarse (interceptor de axios) el socket se reconecta con el nuevo. */
  token: string | null
  executeTool: (
    name: string,
    args: Record<string, unknown>,
    options: { confirmTimeoutMs?: number },
  ) => Promise<ToolResult>
  getContext: () => AgentContext
  /** Tools que registran las pantallas montadas; se mandan con cada mensaje y con cada tool_result. */
  getTools: () => ContextTool[]
  onAssistantDone?: (text: string) => void
  /** El back cerró el turno: ya no espera ningún tool_result (p. ej. una confirmación pendiente). */
  onTurnEnd?: () => void
}

/**
 * Conexión WebSocket con el agente (`/ws/agent/`). Mismo patrón que
 * `usePresenceSocket`, más el bucle de mensajes: el back manda `tool_call`,
 * aquí se ejecutan con `executeTool` y se responde con `tool_result`.
 */
export function useAgentSocket({ enabled, token, executeTool, getContext, getTools, onAssistantDone, onTurnEnd }: Options) {
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const nextId = useRef(1)
  const streamingId = useRef<number | null>(null)
  const assistantText = useRef('')

  // Los callbacks cambian en cada render; el socket debe ver siempre los últimos.
  const latest = useRef({ executeTool, getContext, getTools, onAssistantDone, onTurnEnd })
  useEffect(() => {
    latest.current = { executeTool, getContext, getTools, onAssistantDone, onTurnEnd }
  })

  const pushMessage = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((prev) => [...prev, { id: nextId.current++, role, text }])
  }, [])

  useEffect(() => {
    if (!enabled || !token) return
    let stopped = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0

    const send = (ws: WebSocket, message: ClientMessage) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message))
    }

    const handleServerMessage = (ws: WebSocket, message: ServerMessage) => {
      switch (message.type) {
        case 'assistant_delta': {
          assistantText.current += message.text
          const current = streamingId.current
          if (current === null) {
            const id = nextId.current++
            streamingId.current = id
            setMessages((prev) => [...prev, { id, role: 'assistant', text: message.text }])
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === current ? { ...m, text: m.text + message.text } : m)),
            )
          }
          break
        }
        case 'assistant_done': {
          const text = assistantText.current
          streamingId.current = null
          assistantText.current = ''
          setBusy(false)
          latest.current.onTurnEnd?.()
          if (text.trim()) latest.current.onAssistantDone?.(text)
          break
        }
        case 'tool_call': {
          // Cada tool_call arranca un mensaje nuevo del asistente si vuelve a hablar.
          streamingId.current = null
          pushMessage('action', actionLabel(message.name))
          const options = { confirmTimeoutMs: typeof message.timeout_ms === 'number' ? message.timeout_ms : undefined }
          void latest.current.executeTool(message.name, message.args ?? {}, options).then((result) => {
            // La lista de tools va con cada resultado: si la acción cambió de pantalla, el modelo
            // ve las tools nuevas dentro del mismo turno.
            send(ws, { type: 'tool_result', id: message.id, ...result, tools: latest.current.getTools() })
          })
          break
        }
        case 'error': {
          streamingId.current = null
          assistantText.current = ''
          setBusy(false)
          pushMessage('error', message.message)
          break
        }
      }
    }

    const connect = () => {
      setStatus('connecting')
      const ws = new WebSocket(buildWsUrl('/ws/agent/', token))
      wsRef.current = ws

      ws.onopen = () => {
        attempts = 0
        setStatus('open')
      }

      ws.onmessage = (event) => {
        try {
          handleServerMessage(ws, JSON.parse(event.data as string) as ServerMessage)
        } catch {
          // Mensaje malformado del servidor: se ignora.
        }
      }

      ws.onclose = (event) => {
        if (wsRef.current === ws) wsRef.current = null
        streamingId.current = null
        assistantText.current = ''
        setBusy(false)
        if (stopped) return

        const fatal = FATAL_CLOSE_MESSAGES[event.code]
        if (fatal) {
          setStatus('error')
          pushMessage('error', fatal)
          return
        }
        setStatus('closed')
        const delay = Math.min(RECONNECT_DELAY_MS * 2 ** attempts, MAX_RECONNECT_DELAY_MS)
        attempts += 1
        reconnectTimer = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        // El detalle llega en onclose; aquí no hay nada útil que mostrar.
      }
    }

    connect()
    return () => {
      stopped = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [enabled, token, pushMessage])

  const sendUserMessage = useCallback(
    (text: string): boolean => {
      const ws = wsRef.current
      const trimmed = text.trim()
      if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN) return false
      pushMessage('user', trimmed)
      setBusy(true)
      const message: ClientMessage = {
        type: 'user_message',
        text: trimmed,
        context: latest.current.getContext(),
        context_tools: latest.current.getTools(),
      }
      ws.send(JSON.stringify(message))
      return true
    },
    [pushMessage],
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  return { status, messages, busy, sendUserMessage, clearMessages }
}
