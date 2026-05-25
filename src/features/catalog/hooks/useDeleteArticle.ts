import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteArticle } from '../services/articles-service'
import { ARTICLES_QUERY_KEY } from './useArticles'

export const useDeleteArticle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLES_QUERY_KEY })
    },
  })
}
