import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteArticleVariant } from '../services/article-variants-service'
import { ARTICLE_VARIANTS_QUERY_KEY } from './useArticleVariants'

export const useDeleteArticleVariant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteArticleVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLE_VARIANTS_QUERY_KEY })
    },
  })
}
