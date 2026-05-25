import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { Article } from '../types/article-types'
import ArticleDialog from './ArticleDialog'
import DeleteArticleDialog from './DeleteArticleDialog'

type Props = {
  data: Article[]
  isLoading: boolean
}

export default function ArticlesGrid({ data, isLoading }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => { setSelectedArticle(null); setDialogOpen(true) }}>
            <Plus />
            Nuevo articulo
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
            Cargando articulos...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-6 text-sm text-muted-foreground">
            No hay articulos registrados.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((article) => (
              <Card key={article.id} className="bg-white py-0 transition-shadow hover:shadow-xl">
                <div className="group relative">
                  <img
                    className="h-44 w-full object-cover object-center"
                    src={article.image}
                    alt={article.title}
                  />
                  <div className="absolute inset-x-0 top-0 flex justify-end bg-gradient-to-b from-black/45 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="mr-2 border-white/60 bg-white/95 text-slate-700 shadow-md hover:bg-white"
                      onClick={() => {
                        setSelectedArticle(article)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      className="border border-white/60 bg-red-600 text-white shadow-md hover:bg-red-700"
                      onClick={() => setArticleToDelete(article)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <CardHeader className="px-4 pb-4">
                  <CardTitle className="text-base">{article.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ArticleDialog
        open={dialogOpen}
        article={selectedArticle}
        onClose={() => setDialogOpen(false)}
      />

      <DeleteArticleDialog
        article={articleToDelete}
        onClose={() => setArticleToDelete(null)}
      />
    </>
  )
}
