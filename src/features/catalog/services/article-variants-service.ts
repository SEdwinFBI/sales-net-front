import type {
  ArticleVariant,
  CreateArticleVariantPayload,
} from '../types/article-variant-types'

let store: ArticleVariant[] = [
  { id: 'faja-seda-1', articleId: 'faja-seda', size: '1' },
  { id: 'faja-seda-2', articleId: 'faja-seda', size: '2' },
  { id: 'faja-colombiana-1', articleId: 'faja-colombiana', size: '1' },
  { id: 'blusa-manga-corta-3', articleId: 'blusa-manga-corta', size: '3' },
  { id: 'legging-control-4', articleId: 'legging-control', size: '4' },
]

export const getArticleVariants = async (): Promise<ArticleVariant[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return store
}

export const createArticleVariant = async (
  payload: CreateArticleVariantPayload
): Promise<ArticleVariant> => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const existing = store.find(
    (variant) => variant.articleId === payload.articleId && variant.size === payload.size
  )

  if (existing) return existing

  const variant: ArticleVariant = {
    id: `${payload.articleId}-${payload.size}-${Date.now()}`,
    articleId: payload.articleId,
    size: payload.size,
  }

  store = [...store, variant]
  return variant
}

export const deleteArticleVariant = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  store = store.filter((variant) => variant.id !== id)
}
