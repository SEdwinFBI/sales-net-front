import type { Article } from '@/features/catalog/types/article-types'
import type { ArticleVariant } from '@/features/catalog/types/article-variant-types'
import { rankBySimilarity } from './fuzzy-search'

/** Minúsculas y sin acentos: "Camisa" y "camísa" son lo mismo al buscar. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Resultado de buscar en el catálogo de administración: sin stock (eso solo lo ve el POS). */
export type CatalogSearchResult = {
  id: number
  nombre: string
  variantes: { id: number; talla: string; precio: number }[]
}

/** Filtra artículos del catálogo por título, sin distinguir mayúsculas ni acentos. */
export function searchCatalogArticles(
  articles: Article[],
  variants: ArticleVariant[],
  text: string,
  limit = 10,
): CatalogSearchResult[] {
  const needle = normalizeText(text)
  if (!needle) return []

  return toResults(
    articles.filter((article) => normalizeText(article.title).includes(needle)).slice(0, limit),
    variants,
  )
}

/** Sugerencias por parecido (errores de dictado) cuando la búsqueda exacta no encontró nada. */
export function suggestCatalogArticles(articles: Article[], variants: ArticleVariant[], text: string): CatalogSearchResult[] {
  return toResults(rankBySimilarity(articles, (article) => article.title, text), variants)
}

function toResults(articles: Article[], variants: ArticleVariant[]): CatalogSearchResult[] {
  return articles.map((article) => ({
      id: article.id,
      nombre: article.title,
      variantes: variants
        .filter((variant) => variant.articleId === article.id)
        .map((variant) => ({ id: variant.id, talla: variant.size, precio: variant.price })),
    }))
}
