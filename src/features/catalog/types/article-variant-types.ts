export type ArticleSize = string

export type ArticleVariant = {
  id: number
  articleId: number
  size: ArticleSize
  sizeId: number
  price: number
}

export type CreateArticleVariantPayload = {
  articleId: number
  size: ArticleSize
  price: number
}

export type UpdateArticleVariantPayload = {
  id: number
  articleId?: number
  size?: ArticleSize
  price?: number
}
