import { products } from '@/features/sales/mocks/productos'
import type {
  Article,
  CreateArticlePayload,
  UpdateArticlePayload,
} from '../types/article-types'

let store: Article[] = []

const getStore = async (): Promise<Article[]> => {
  if (store.length === 0) {
    store = products.map((product) => ({
      id: product.id,
      title: product.name,
      image: product.image,
    }))
  }

  return store
}

export const getArticles = async (): Promise<Article[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return getStore()
}

export const createArticle = async (payload: CreateArticlePayload): Promise<Article> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const list = await getStore()
  const article: Article = {
    id: Date.now().toString(),
    title: payload.title,
    image: payload.image,
  }

  store = [...list, article]
  return article
}

export const updateArticle = async (payload: UpdateArticlePayload): Promise<Article> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const list = await getStore()
  const article: Article = {
    id: payload.id,
    title: payload.title,
    image: payload.image,
  }

  store = list.map((item) => (item.id === payload.id ? article : item))
  return article
}

export const deleteArticle = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const list = await getStore()
  store = list.filter((item) => item.id !== id)
}
