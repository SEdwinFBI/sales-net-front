export type Article = {
  id: string
  title: string
  image: string
}

export type CreateArticlePayload = {
  title: string
  image: string
}

export type UpdateArticlePayload = CreateArticlePayload & {
  id: string
}
