export type ArticleSize = '1' | '2' | '3' | '4' | '5' | '6'

export type ArticleVariant = {
  id: string
  articleId: string
  size: ArticleSize
}

export type CreateArticleVariantPayload = {
  articleId: string
  size: ArticleSize
}
