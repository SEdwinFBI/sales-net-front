import { api } from '@/lib/api'
import type {
  Article,
  CreateArticlePayload,
  UpdateArticlePayload,
} from '../types/article-types'

type ApiResponse<T> = {
  status: 'success' | 'error'
  data: T
}

type PaginatedData<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

type ArticleApi = {
  id: number
  titulo: string
  imagen_url: string | null
}

const getApiOrigin = () => {
  const baseUrl = import.meta.env.VITE_API_URL as string | undefined
  if (!baseUrl) return ''

  try {
    return new URL(baseUrl).origin
  } catch {
    return ''
  }
}

const resolveImageUrl = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  const origin = getApiOrigin()
  if (!origin) return imageUrl
  if (imageUrl.startsWith('/')) return `${origin}${imageUrl}`

  return `${origin}/media/${imageUrl}`
}

const mapArticle = (article: ArticleApi): Article => ({
  id: article.id,
  title: article.titulo,
  image: resolveImageUrl(article.imagen_url),
})

const normalizeArticleList = (payload: ArticleApi[] | PaginatedData<ArticleApi>) =>
  Array.isArray(payload) ? payload : payload.results

export const getArticles = async (): Promise<Article[]> => {
  const firstPage = await api.get<ApiResponse<ArticleApi[] | PaginatedData<ArticleApi>>>(
    '/admin/articles/'
  )
  const firstData = firstPage.data.data

  if (Array.isArray(firstData)) return firstData.map(mapArticle)

  const totalPages = Math.ceil(firstData.count / Math.max(firstData.results.length, 1))
  const restPages = await Promise.all(
    Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
      api.get<ApiResponse<PaginatedData<ArticleApi>>>('/admin/articles/', {
        params: { page: index + 2 },
      })
    )
  )

  return [
    ...firstData.results,
    ...restPages.flatMap((response) => normalizeArticleList(response.data.data)),
  ].map(mapArticle)
}

export const createArticle = async (payload: CreateArticlePayload): Promise<Article> => {
  const formData = new FormData()
  formData.append('titulo', payload.title)
  formData.append('imagen_url', payload.image)

  const { data } = await api.post<ApiResponse<ArticleApi>>('/admin/articles/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return mapArticle(data.data)
}

export const updateArticle = async (payload: UpdateArticlePayload): Promise<Article> => {
  const formData = new FormData()
  formData.append('titulo', payload.title)
  if (payload.image) formData.append('imagen_url', payload.image)

  const { data } = await api.put<ApiResponse<ArticleApi>>(
    `/admin/articles/${payload.id}/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return mapArticle(data.data)
}

export const deleteArticle = async (id: number): Promise<void> => {
  await api.delete(`/admin/articles/${id}/`)
}
