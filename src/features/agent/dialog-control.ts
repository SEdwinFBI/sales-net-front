/** Diálogos de Base UI y drawers de vaul abiertos en la app. */
const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]'
const CLOSE_SELECTOR = '[data-slot="dialog-close"], [data-slot="drawer-close"]'
const TITLE_SELECTOR = '[data-slot="dialog-title"], [data-slot="drawer-title"], h2'

/** Marca el panel del asistente: su tarjeta de confirmación no es un diálogo de la pantalla. */
export const AGENT_WIDGET_ATTR = 'data-agent-widget'

export type CloseDialogOutcome = {
  resultado: 'cerrado' | 'sin_dialogo' | 'ocupado' | 'no_cerro'
  titulo?: string
}

function openDialogs(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(DIALOG_SELECTOR)].filter(
    (el) =>
      !el.closest(`[${AGENT_WIDGET_ATTR}]`) &&
      !el.hasAttribute('data-closed') &&
      el.getAttribute('data-state') !== 'closed',
  )
}

/**
 * Cierra el diálogo de más arriba como lo haría el usuario: con su botón X, o con Escape si no
 * tiene. No guarda nada. Un X deshabilitado significa que el diálogo está procesando.
 */
export async function closeTopDialog(timeoutMs = 1500, pollMs = 50): Promise<CloseDialogOutcome> {
  const top = openDialogs().at(-1)
  if (!top) return { resultado: 'sin_dialogo' }

  const titulo = top.querySelector(TITLE_SELECTOR)?.textContent?.trim() || undefined
  const close = top.querySelector<HTMLButtonElement>(CLOSE_SELECTOR)
  if (close?.disabled) return { resultado: 'ocupado', titulo }

  if (close) close.click()
  else top.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }))

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!top.isConnected || !openDialogs().includes(top)) return { resultado: 'cerrado', titulo }
    await new Promise((resolve) => setTimeout(resolve, pollMs))
  }
  return { resultado: 'no_cerro', titulo }
}
