import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createArticleVariant } from '../services/article-variants-service'
import type { CreateArticleVariantPayload } from '../types/article-variant-types'
import { ARTICLE_VARIANTS_QUERY_KEY } from './useArticleVariants'

export const useCreateArticleVariant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateArticleVariantPayload) => createArticleVariant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLE_VARIANTS_QUERY_KEY })
    },
  })
}
