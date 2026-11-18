import { fold } from './tool-helpers'

/**
 * Búsqueda tolerante para las tools del agente: el dictado del navegador confunde nombres
 * ("Brich" → "bridge"), así que cuando la búsqueda exacta no encuentra nada se ofrecen
 * sugerencias ordenadas por parecido. Solo sugiere: nunca elige por el usuario.
 */

/** Palabras que no aportan al comparar nombres. */
const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'y', 'para', 'un', 'una', 'en'])

/** Parecido mínimo (0-1) para sugerir un resultado. */
export const MIN_SIMILARITY = 0.7
/** Máximo de sugerencias que se devuelven al modelo (cuidan los tokens). */
export const MAX_SUGGESTIONS = 5

function tokens(text: string): string[] {
  return fold(text)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean)
}

/** Palabras con contenido (sin conectores), en el orden en que se dijeron. */
export function significantWords(text: string): string[] {
  return tokens(text).filter((word) => word.length >= 2 && !STOPWORDS.has(word))
}

/**
 * Clave fonética simple (español, con los sonidos del inglés que el dictado suele poner):
 * "bridge" y "brich" dan la misma clave; también b/v, s/z/c, k/qu/c y la h muda.
 */
export function phoneticKey(word: string): string {
  return fold(word)
    .replace(/tch|dge|dg|sh/g, 'ch')
    .replace(/ch/g, '#')
    .replace(/ph/g, 'f')
    .replace(/qu/g, 'k')
    .replace(/c([eiy])/g, 's$1')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/w/g, 'u')
    .replace(/ll/g, 'y')
    .replace(/h/g, '')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/y$/, 'i')
    .replace(/(.)\1+/g, '$1')
    .replace(/(.{3,})e$/, '$1')
    .replace(/#/g, 'ch')
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = curr
  }
  return prev[b.length]
}

function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max
}

/** Parecido entre dos palabras (0-1): exacto, prefijo, o el mejor entre texto y clave fonética. */
function wordSimilarity(query: string, candidate: string): number {
  if (query === candidate) return 1
  if (query.length >= 3 && (candidate.startsWith(query) || (query.startsWith(candidate) && candidate.length >= 3))) return 0.9
  return Math.max(ratio(query, candidate), ratio(phoneticKey(query), phoneticKey(candidate)))
}

/** Parecido de un nombre con lo buscado: promedio, por palabra buscada, de su mejor palabra en el nombre. */
export function similarity(query: string, name: string): number {
  const wanted = significantWords(query)
  const available = tokens(name)
  if (wanted.length === 0 || available.length === 0) return 0
  const total = wanted.reduce((sum, word) => sum + Math.max(...available.map((candidate) => wordSimilarity(word, candidate))), 0)
  return total / wanted.length
}

/** Los elementos más parecidos a `query` (sin repetir ids), del más al menos parecido. */
export function rankBySimilarity<T extends { id: number }>(
  items: readonly T[],
  getName: (item: T) => string,
  query: string,
  { limit = MAX_SUGGESTIONS, min = MIN_SIMILARITY }: { limit?: number; min?: number } = {},
): T[] {
  const seen = new Set<number>()
  return items
    .filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
    .map((item) => ({ item, score: similarity(query, getName(item)) }))
    .filter(({ score }) => score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

/** Prefijos (3 letras) de las palabras buscadas, para traer candidatos del servidor sin la palabra mal dictada. */
export function candidatePrefixes(text: string, max = 3): string[] {
  return [...new Set(significantWords(text).filter((w) => w.length >= 3).map((w) => w.slice(0, 3)))].slice(0, max)
}
