import { isCredentialKey } from './tool-helpers'

/** Diálogos de Base UI y drawers de vaul abiertos en la app. */
const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]'
const CLOSE_SELECTOR = '[data-slot="dialog-close"], [data-slot="drawer-close"]'
const TITLE_SELECTOR = '[data-slot="dialog-title"], [data-slot="drawer-title"], h2'
const FIELD_SELECTOR = 'input, textarea, select'

/** Marca el panel del asistente: su tarjeta de confirmación no es un diálogo de la pantalla. */
export const AGENT_WIDGET_ATTR = 'data-agent-widget'

/** Campos que se reportan de un diálogo, para que el modelo diga qué se perdió. */
const MAX_FIELDS = 12
const MAX_VALUE_CHARS = 60
const SKIPPED_INPUT_TYPES = new Set(['hidden', 'password', 'file', 'button', 'submit', 'reset', 'image'])

export type DialogField = { campo: string; valor: string }

/** Lo que el usuario tiene en un diálogo abierto: su título y lo que escribió o eligió. */
export type OpenDialogInfo = { titulo?: string; valores: DialogField[] }

export type CloseDialogOutcome = {
  resultado: 'cerrado' | 'sin_dialogo' | 'ocupado' | 'no_cerro'
  titulo?: string
  /** Lo que tenía el diálogo al cerrarlo (se descarta; nada se guarda). */
  valores?: DialogField[]
}

/** Lo mínimo que se lee de un campo de formulario (permite probar sin DOM). */
export type FieldLike = {
  type?: string
  name?: string
  id?: string
  value?: string
  checked?: boolean
  placeholder?: string
  tagName?: string
  getAttribute?: (name: string) => string | null
  labels?: ArrayLike<{ textContent: string | null }> | null
  selectedOptions?: ArrayLike<{ textContent: string | null }> | null
}

/** Texto con el que el usuario reconoce el campo (etiqueta, aria-label, nombre o placeholder). */
function fieldName(field: FieldLike): string {
  const label = field.labels?.[0]?.textContent?.trim()
  return label || field.getAttribute?.('aria-label') || field.name || field.placeholder || field.id || 'campo'
}

/**
 * Campos con valor de un diálogo. Nunca incluye contraseñas ni nada con nombre de credencial, ni
 * campos vacíos; los valores se recortan para no inflar lo que se le manda al modelo.
 */
export function readDialogFields(fields: Iterable<FieldLike>): DialogField[] {
  const result: DialogField[] = []
  for (const field of fields) {
    const type = (field.type ?? '').toLowerCase()
    if (SKIPPED_INPUT_TYPES.has(type)) continue
    const campo = fieldName(field)
    if (isCredentialKey(campo) || isCredentialKey(field.name ?? '') || isCredentialKey(field.id ?? '')) continue

    let valor: string
    if (type === 'checkbox' || type === 'radio') {
      if (!field.checked) continue
      valor = type === 'checkbox' ? 'si' : (field.value ?? '')
    } else if (field.tagName?.toLowerCase() === 'select') {
      valor = field.selectedOptions?.[0]?.textContent?.trim() ?? field.value ?? ''
    } else {
      valor = field.value ?? ''
    }
    valor = valor.trim()
    if (!valor) continue
    result.push({ campo: campo.slice(0, 40), valor: valor.slice(0, MAX_VALUE_CHARS) })
    if (result.length >= MAX_FIELDS) break
  }
  return result
}

function openDialogs(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(DIALOG_SELECTOR)].filter(
    (el) =>
      !el.closest(`[${AGENT_WIDGET_ATTR}]`) &&
      !el.hasAttribute('data-closed') &&
      el.getAttribute('data-state') !== 'closed',
  )
}

function describe(top: HTMLElement): OpenDialogInfo {
  return {
    titulo: top.querySelector(TITLE_SELECTOR)?.textContent?.trim() || undefined,
    valores: readDialogFields(top.querySelectorAll<HTMLInputElement>(FIELD_SELECTOR)),
  }
}

/** El diálogo de más arriba con lo que tiene escrito, o null si no hay ninguno. */
export function readTopDialog(): OpenDialogInfo | null {
  const top = openDialogs().at(-1)
  return top ? describe(top) : null
}

/**
 * Cierra el diálogo de más arriba como lo haría el usuario: con su botón X, o con Escape si no
 * tiene. No guarda nada. Un X deshabilitado significa que el diálogo está procesando.
 */
export async function closeTopDialog(timeoutMs = 1500, pollMs = 50): Promise<CloseDialogOutcome> {
  const top = openDialogs().at(-1)
  if (!top) return { resultado: 'sin_dialogo' }

  const { titulo, valores } = describe(top)
  const close = top.querySelector<HTMLButtonElement>(CLOSE_SELECTOR)
  if (close?.disabled) return { resultado: 'ocupado', titulo }

  if (close) close.click()
  else top.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }))

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!top.isConnected || !openDialogs().includes(top)) return { resultado: 'cerrado', titulo, valores }
    await new Promise((resolve) => setTimeout(resolve, pollMs))
  }
  return { resultado: 'no_cerro', titulo }
}
