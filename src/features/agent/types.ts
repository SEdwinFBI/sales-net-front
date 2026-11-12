/** Resultado de ejecutar una tool en el front; viaja de vuelta al back como `tool_result`. */
export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string }

export type AgentContext = {
  route: string
  role: string
  permissions: string[]
  puede_anular: boolean
  cart: {
    items: {
      articulo_id: number
      variante_id: number
      nombre: string
      talla: string
      cantidad: number
      precio: number
    }[]
    total: number
    customerId: string | null
  }
  activeDialog: string | null
  routes: { path: string; name: string; description?: string; plantilla?: boolean }[]
}

export type ServerMessage =
  | { type: 'assistant_delta'; text: string }
  | { type: 'assistant_done' }
  | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
  | { type: 'error'; message: string }

/** Tools que registran las pantallas montadas; el back las ofrece al modelo junto con las estáticas. */
export type ContextTool = {
  name: string
  description: string
  parameters: Record<string, unknown>
  requiere_confirmacion: boolean
}

export type ClientMessage =
  | { type: 'user_message'; text: string; context: AgentContext; context_tools: ContextTool[] }
  | ({ type: 'tool_result'; id: string; tools: ContextTool[] } & (
      | { ok: true; data: unknown }
      | { ok: false; error: string }
    ))

export type ChatMessage = {
  id: number
  role: 'user' | 'assistant' | 'action' | 'error'
  text: string
}

export type AgentStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'
