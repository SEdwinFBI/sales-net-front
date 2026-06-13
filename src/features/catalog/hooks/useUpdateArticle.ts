import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateArticle } from '../services/articles-service'
import type { UpdateArticlePayload } from '../types/article-types'
import { ARTICLES_QUERY_KEY } from './useArticles'

export const useUpdateArticle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateArticlePayload) => updateArticle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_QUERY_KEY })
    },
  })
}
