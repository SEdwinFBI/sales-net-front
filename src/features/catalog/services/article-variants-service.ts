import { api } from '@/lib/api'
import type {
  ArticleSize,
  ArticleVariant,
  CreateArticleVariantPayload,
  UpdateArticleVariantPayload,
} from '../types/article-variant-types'

type ApiResponse<T> = {
  status: 'success' | 'error'
  data: T
}

type TallaApi = {
  id: number
  nombre: string
  activo: boolean
}

type VariantApi = {
  id: number
  id_articulo: number
  id_talla: number
  precio_unidad_base: string | number
  activo: boolean
}

const knownSizes: ArticleSize[] = ['1', '2', '3', '4', '5', '6']

const toArticleSize = (value: string): ArticleSize | null => {
  const normalized = value.trim()
  return knownSizes.includes(normalized as ArticleSize)
    ? (normalized as ArticleSize)
    : null
}

const getTallas = async (): Promise<TallaApi[]> => {
  const { data } = await api.get<ApiResponse<TallaApi[]>>('/admin/tallas/')
  return data.data
}

const getOrCreateTalla = async (size: ArticleSize): Promise<TallaApi> => {
  const tallas = await getTallas()
  const existing = tallas.find((talla) => talla.nombre.trim() === size)
  if (existing) return existing

  const { data } = await api.post<ApiResponse<TallaApi>>('/admin/tallas/', { nombre: size })
  return data.data
}

export const getArticleVariants = async (): Promise<ArticleVariant[]> => {
  const [variantsResponse, tallas] = await Promise.all([
    api.get<ApiResponse<VariantApi[]>>('/admin/variantes/'),
    getTallas(),
  ])
  const tallasById = new Map(tallas.map((talla) => [talla.id, talla]))

  return variantsResponse.data.data
    .map((variant) => {
      const size = toArticleSize(tallasById.get(variant.id_talla)?.nombre ?? '')
      if (!size) return null

      return {
        id: variant.id,
        articleId: variant.id_articulo,
        size,
        sizeId: variant.id_talla,
        price: Number(variant.precio_unidad_base),
      }
    })
    .filter((variant): variant is ArticleVariant => variant !== null)
}

export const createArticleVariant = async (
  payload: CreateArticleVariantPayload
): Promise<ArticleVariant> => {
  const talla = await getOrCreateTalla(payload.size)
  const { data } = await api.post<ApiResponse<VariantApi>>('/admin/variantes/', {
    id_articulo: payload.articleId,
    id_talla: talla.id,
    precio_unidad_base: payload.price,
  })

  return {
    id: data.data.id,
    articleId: data.data.id_articulo,
    size: payload.size,
    sizeId: data.data.id_talla,
    price: Number(data.data.precio_unidad_base),
  }
}

export const updateArticleVariant = async (
  payload: UpdateArticleVariantPayload
): Promise<ArticleVariant> => {
  const body: Partial<{
    id_articulo: number
    id_talla: number
    precio_unidad_base: number
  }> = {}

  if (payload.articleId !== undefined) body.id_articulo = payload.articleId
  if (payload.price !== undefined) body.precio_unidad_base = payload.price
  if (payload.size !== undefined) {
    const talla = await getOrCreateTalla(payload.size)
    body.id_talla = talla.id
  }

  const { data } = await api.put<ApiResponse<VariantApi>>(
    `/admin/variantes/${payload.id}/`,
    body
  )
  const tallas = await getTallas()
  const size = toArticleSize(
    tallas.find((talla) => talla.id === data.data.id_talla)?.nombre ?? payload.size ?? ''
  )

  return {
    id: data.data.id,
    articleId: data.data.id_articulo,
    size: size ?? '1',
    sizeId: data.data.id_talla,
    price: Number(data.data.precio_unidad_base),
  }
}

export const deleteArticleVariant = async (id: number): Promise<void> => {
  await api.delete(`/admin/variantes/${id}/`)
}
