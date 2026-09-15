/** Nodos del 1 al 9, ordenados por filas; incluye el punto intermedio al saltar. */
export function appendPatternNode(pattern: number[], node: number): number[] {
  if (!Number.isInteger(node) || node < 1 || node > 9 || pattern.includes(node)) return pattern
  const last = pattern.at(-1)
  if (last !== undefined) {
    const row = Math.floor((last - 1) / 3)
    const col = (last - 1) % 3
    const nextRow = Math.floor((node - 1) / 3)
    const nextCol = (node - 1) % 3
    if ((row + nextRow) % 2 === 0 && (col + nextCol) % 2 === 0) {
      const middle = ((row + nextRow) / 2) * 3 + (col + nextCol) / 2 + 1
      if (!pattern.includes(middle)) return [...pattern, middle, node]
    }
  }
  return [...pattern, node]
}
