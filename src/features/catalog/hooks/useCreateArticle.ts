import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createArticle } from '../services/articles-service'
import type { CreateArticlePayload } from '../types/article-types'
import { ARTICLES_QUERY_KEY } from './useArticles'

export const useCreateArticle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateArticlePayload) => createArticle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_QUERY_KEY })
    },
  })
}
