import type { AgentToolDef } from '@/features/agent/registry/agent-tool-registry'
import type { ToolResult } from '@/features/agent/types'
import type { Cliente } from '../types/clientes'
import { sanitizeClienteValues, type ClienteFormValues } from './cliente-form-values'

/** Lo que ClienteDialog le presta al agente: leer el estado del formulario y escribir en él. */
export type ClienteDialogAgentContext = {
  isAdmin: () => boolean
  /** Cliente que se edita; null al crear. */
  getCliente: () => Cliente | null
  getValues: () => ClienteFormValues
  /** Escribe los campos en el formulario (react-hook-form) para que el usuario los vea y los revise. */
  setValues: (values: Partial<ClienteFormValues>) => void
}

export const CLIENTE_FORM_PARAMETERS = {
  type: 'object',
  properties: {
    nombre_completo: { type: 'string' },
    direccion: { type: 'string' },
    telefono: { type: 'string', description: 'Solo digitos, al menos 8.' },
    permitir_credito: { type: 'boolean' },
    balance: { type: 'number', minimum: 0, description: 'Solo con credito.' },
    dias_notificacion: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 7 },
      description: 'Dias de aviso de cobro: 1 lunes ... 7 domingo.',
    },
    activo: { type: 'boolean' },
  },
  additionalProperties: false,
} as const

export function fillClienteForm(args: Record<string, unknown>, ctx: ClienteDialogAgentContext): ToolResult {
  if (!ctx.isAdmin()) return { ok: false, error: 'Solo un administrador puede editar clientes.' }

  const cliente = ctx.getCliente()
  const { values, ignorados, errores, notas } = sanitizeClienteValues(args, {
    creditoBloqueado: cliente !== null && Number(cliente.balance) !== 0,
  })

  if (Object.keys(values).length === 0) {
    return {
      ok: false,
      error: errores.length ? errores.join(' ') : 'No hay ningun campo valido para llenar.',
    }
  }

  ctx.setValues(values)
  return {
    ok: true,
    data: {
      aplicado: values,
      ...(ignorados.length ? { campos_no_permitidos: ignorados } : {}),
      ...(errores.length ? { errores } : {}),
      ...(notas.length ? { notas } : {}),
      valores_actuales: ctx.getValues(),
      mensaje: 'Campos llenados. El usuario debe revisar el formulario y presionar el boton para guardar.',
    },
  }
}

/** Tools que existen mientras ClienteDialog está abierto. */
export function buildClienteDialogTools(ctx: ClienteDialogAgentContext): AgentToolDef[] {
  return [
    {
      name: 'llenar_formulario_cliente',
      description:
        'Llena campos del formulario de cliente abierto (nombre, direccion, telefono, credito, balance, dias de aviso, activo). No guarda: el usuario revisa y guarda.',
      parameters: CLIENTE_FORM_PARAMETERS,
      run: async (args) => fillClienteForm(args, ctx),
    },
  ]
}
