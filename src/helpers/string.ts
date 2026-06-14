/**
 * Devuelve hasta 2 iniciales en mayúscula a partir de un nombre completo.
 * Retorna '?' si el nombre está vacío o es indefinido.
 */
export function initials(name?: string): string {
  return (
    (name ?? '')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}
