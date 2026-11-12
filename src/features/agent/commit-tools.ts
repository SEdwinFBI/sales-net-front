import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import type { AgentToolDef } from './registry/agent-tool-registry'
import { NO_PARAMS, fail, ok } from './tool-helpers'
import type { ToolResult } from './types'

type CommitSpec = {
  name: string
  /** Qué botón presiona. Se le agrega que requiere el clic de confirmación del usuario. */
  description: string
  /** Motivo por el que ahora no se puede (botón deshabilitado, nada que guardar...), o null. */
  validar?: () => string | null
  /** Texto de la tarjeta de confirmación, con los datos reales que se van a guardar o borrar. */
  texto: () => string
  /** Mismo flujo que el botón de la pantalla. `false` = falló (el error ya se muestra en pantalla). */
  run: () => Promise<boolean | ToolResult>
}

const SUFFIX = ' El usuario debe confirmarlo con un clic en el asistente.'

/**
 * Tool que presiona por el usuario un botón que guarda, cobra, anula o elimina. Siempre pide
 * confirmación y solo existe si el despliegue activa las acciones de guardado (`ejecuta`).
 */
export function commitTool({ name, description, validar, texto, run }: CommitSpec): AgentToolDef {
  return {
    name,
    description: description + SUFFIX,
    parameters: NO_PARAMS,
    requiere_confirmacion: true,
    ejecuta: true,
    validar: () => validar?.() ?? null,
    textoConfirmacion: texto,
    run: async () => {
      const result = await run()
      if (typeof result !== 'boolean') return result
      return result ? ok({ mensaje: 'Hecho.' }) : fail('No se pudo completar: revisa el mensaje que aparece en pantalla.')
    },
  }
}

/**
 * Envía un formulario de react-hook-form como lo haría su botón. Si la validación del formulario
 * falla, devuelve los campos con error en vez de enviar.
 */
export async function submitForm<T extends FieldValues>(
  handleSubmit: UseFormHandleSubmit<T>,
  onSubmit: (values: T) => Promise<boolean>,
): Promise<ToolResult> {
  let result: ToolResult = fail('No se pudo enviar el formulario.')
  await handleSubmit(
    async (values) => {
      result = (await onSubmit(values))
        ? ok({ mensaje: 'Guardado.' })
        : fail('No se pudo guardar: revisa el mensaje que aparece en pantalla.')
    },
    (errors) => {
      const detalle = Object.entries(errors)
        .map(([campo, error]) => `${campo}: ${String((error as { message?: unknown } | undefined)?.message ?? 'invalido')}`)
        .join('; ')
      result = fail(`El formulario tiene errores (${detalle}). Corrigelos antes de guardar.`)
    },
  )()
  return result
}
