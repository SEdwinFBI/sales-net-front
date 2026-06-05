export type Article = {
  id: number
  title: string
  image: string | null
}

export type CreateArticlePayload = {
  title: string
  image: File
}

export type UpdateArticlePayload = {
  id: number
  title: string
  image?: File
}
