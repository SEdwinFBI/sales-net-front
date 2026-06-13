import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateArticleVariant } from '../services/article-variants-service'
import type { UpdateArticleVariantPayload } from '../types/article-variant-types'
import { ARTICLE_VARIANTS_QUERY_KEY } from './useArticleVariants'

export const useUpdateArticleVariant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateArticleVariantPayload) => updateArticleVariant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLE_VARIANTS_QUERY_KEY })
    },
  })
}
