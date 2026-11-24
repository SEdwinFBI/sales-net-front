import type { OrigenVentas, PorOrigen } from '../types/reportes'

type CampoOrigen = 'total_neto' | 'cantidad_ventas'

/**
 * Desglose de una cifra por origen: "POS Q100 · Cliente Q50". Sin ventas del cliente (filtro de
 * artículo o talla) dice que es solo POS. Devuelve null si el API no trae `por_origen`.
 */
export function desgloseOrigen<P extends Pick<OrigenVentas, CampoOrigen>>(
  porOrigen: Pick<PorOrigen<P, P>, 'pos' | 'cliente'> | undefined,
  campo: CampoOrigen,
  formato: (valor: number) => string,
): string | null {
  if (!porOrigen) return null
  const pos = formato(Number(porOrigen.pos[campo] ?? 0))
  if (!porOrigen.cliente) return `Solo POS ${pos}`
  return `POS ${pos} · Cliente ${formato(Number(porOrigen.cliente[campo] ?? 0))}`
}
