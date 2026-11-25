import type { FilterFn } from '@tanstack/react-table'

/** Minusculas y sin tildes: "Observación" y "observacion" son lo mismo al filtrar. */
export const normalizarTexto = (valor: unknown): string =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Por cada columna, lo que el usuario VE en la celda (moneda con formato, fecha legible, "#12"...). */
export type TextoVisible<T> = Record<string, (fila: T) => string | null | undefined>

/**
 * Filtro por texto para las cajitas "Filtrar..." de las columnas.
 *
 * TanStack elige el filtro "auto" segun la PRIMERA fila de los datos: con un valor nulo pasa a igualdad exacta y con
 * un numero a un rango (el "12" escrito se lee como rango 1-2), y ninguno sirve para escribir texto. Este busca el
 * texto en el valor crudo y en lo que se ve en pantalla, sin importar mayusculas ni tildes, y tolera nulos.
 * Se usa como `defaultColumn: { filterFn: crearFiltroTexto(...) }`.
 */
export function crearFiltroTexto<T>(textoVisible: TextoVisible<T> = {}): FilterFn<T> {
  const filtro: FilterFn<T> = (row, columnId, filterValue) => {
    const buscado = normalizarTexto(filterValue)
    if (!buscado) return true
    const visible = textoVisible[columnId]?.(row.original)
    return [row.getValue(columnId), visible].some(
      (valor) => valor != null && normalizarTexto(valor).includes(buscado),
    )
  }
  filtro.autoRemove = (valor) => !normalizarTexto(valor)
  return filtro
}
