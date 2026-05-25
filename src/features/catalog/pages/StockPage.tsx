import { useMemo, useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { useUsuarios } from '@/features/adminUsuarios/hooks/useUsuarios'
import SellerStockEditor from '../components/SellerStockEditor'
import SellersStockList from '../components/SellersStockList'
import { useArticles } from '../hooks/useArticles'
import { useArticleVariants } from '../hooks/useArticleVariants'
import { useSellerStock } from '../hooks/useSellerStock'

export default function StockPage() {
  const [selectedSeller, setSelectedSeller] = useState<Usuario | null>(null)
  const { data: users, isLoading: isLoadingUsers } = useUsuarios()
  const { data: articles, isLoading: isLoadingArticles } = useArticles()
  const { data: variants, isLoading: isLoadingVariants } = useArticleVariants()
  const { data: stock, isLoading: isLoadingStock } = useSellerStock(selectedSeller?.id)

  const sellers = useMemo(
    () => users.filter((user) => user.role === 'vendedor'),
    [users]
  )

  return (
    <PageTemplateSimple
      title="Stock"
      description="Gestion de stock por vendedor."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Stock</p>
      </div>

      <div className="mt-4">
        {selectedSeller ? (
          <SellerStockEditor
            articles={articles}
            isLoading={isLoadingArticles || isLoadingVariants || isLoadingStock}
            seller={selectedSeller}
            stock={stock}
            variants={variants}
            onBack={() => setSelectedSeller(null)}
          />
        ) : (
          <SellersStockList
            isLoading={isLoadingUsers}
            sellers={sellers}
            onSelect={setSelectedSeller}
          />
        )}
      </div>
    </PageTemplateSimple>
  )
}
