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
  preparar_venta: 'Preparando la venta…',
  abrir_formulario_cliente: 'Abriendo el formulario…',
  cerrar_dialogo: 'Cerrando el diálogo…',
  // Consultas que el back resuelve sin pasar por el front.
  consultar_ventas: 'Consultando ventas…',
  consultar_abonos: 'Consultando abonos…',
  consultar_clientes: 'Consultando clientes…',
  consultar_stock: 'Consultando existencias…',
  consultar_precios_especiales: 'Consultando precios especiales…',
  consultar_cajas: 'Consultando cajas…',
  consultar_equipo_sucursal: 'Consultando equipo de la sucursal…',
}

/** Etiqueta de las tools de pantalla según su prefijo (las convenciones del manual). */
const PREFIX_LABELS: [string, string][] = [
  ['consultar_', 'Consultando…'],
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

export type ServerMessageHandlerContext = {
  streamingId: { current: number | null }
  assistantText: { current: string }
  nextMessageId: () => number
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void
  pushMessage: (role: ChatMessage['role'], text: string) => void
  setBusy: (busy: boolean) => void
  executeTool: Options['executeTool']
  getTools: Options['getTools']
  onAssistantDone?: (text: string) => void
  onTurnEnd?: () => void
  sendToolResult: (payload: Extract<ClientMessage, { type: 'tool_result' }>) => void
}

/** Procesa un mensaje entrante del servidor del agente y actualiza el estado de la conversación. */
export function applyAgentServerMessage(message: ServerMessage, ctx: ServerMessageHandlerContext) {
  switch (message.type) {
    case 'assistant_delta': {
      ctx.assistantText.current += message.text
      const current = ctx.streamingId.current
      if (current === null) {
        const id = ctx.nextMessageId()
        ctx.streamingId.current = id
        ctx.setMessages((prev) => [...prev, { id, role: 'assistant', text: message.text }])
      } else {
        ctx.setMessages((prev) =>
          prev.map((m) => (m.id === current ? { ...m, text: m.text + message.text } : m)),
        )
      }
      break
    }
    case 'assistant_done': {
      const text = ctx.assistantText.current
      ctx.streamingId.current = null
      ctx.assistantText.current = ''
      ctx.setBusy(false)
      ctx.onTurnEnd?.()
      if (text.trim()) ctx.onAssistantDone?.(text)
      break
    }
    case 'tool_progress': {
      ctx.streamingId.current = null
      ctx.pushMessage('action', actionLabel(message.name))
      break
    }
    case 'tool_call': {
      // Cada tool_call arranca un mensaje nuevo del asistente si vuelve a hablar.
      ctx.streamingId.current = null
      ctx.pushMessage('action', actionLabel(message.name))
      const options = { confirmTimeoutMs: typeof message.timeout_ms === 'number' ? message.timeout_ms : undefined }
      void ctx.executeTool(message.name, message.args ?? {}, options).then((result) => {
        // La lista de tools va con cada resultado: si la acción cambió de pantalla, el modelo
        // ve las tools nuevas dentro del mismo turno.
        ctx.sendToolResult({ type: 'tool_result', id: message.id, ...result, tools: ctx.getTools() })
      })
      break
    }
    case 'reset_ok': {
      ctx.streamingId.current = null
      ctx.assistantText.current = ''
      break
    }
    case 'error': {
      ctx.streamingId.current = null
      ctx.assistantText.current = ''
      ctx.setBusy(false)
      ctx.pushMessage('error', message.message)
      break
    }
  }
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
      applyAgentServerMessage(message, {
        streamingId,
        assistantText,
        nextMessageId: () => nextId.current++,
        setMessages,
        pushMessage,
        setBusy,
        executeTool: (...args) => latest.current.executeTool(...args),
        getTools: () => latest.current.getTools(),
        onAssistantDone: (text) => latest.current.onAssistantDone?.(text),
        onTurnEnd: () => latest.current.onTurnEnd?.(),
        sendToolResult: (payload) => send(ws, payload),
      })
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

  /** Limpia la pantalla y le pide al back olvidar la conversación (si no, seguiría respondiendo con ese contexto). */
  const clearMessages = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'reset' } satisfies ClientMessage))
    streamingId.current = null
    assistantText.current = ''
    setBusy(false)
    setMessages([])
    // El back cancela las tools pendientes: una tarjeta de confirmación abierta ya no tiene a quién responder.
    latest.current.onTurnEnd?.()
  }, [])

  return { status, messages, busy, sendUserMessage, clearMessages }
}
