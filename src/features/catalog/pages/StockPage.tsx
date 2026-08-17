import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import type { Sucursal } from '@/features/adminSucursales/types/sucursal-types'
import { useSucursales } from '@/features/adminSucursales/hooks/useSucursales'
import SellerStockEditor from '../components/SellerStockEditor'
import SellersStockList from '../components/SellersStockList'
import { useArticles } from '../hooks/useArticles'
import { useArticleVariants } from '../hooks/useArticleVariants'
import { useSellerStock } from '../hooks/useSellerStock'

export default function StockPage() {
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null)
  const { data: sucursales, isLoading: isLoadingSucursales } = useSucursales()
  const { data: articles, isLoading: isLoadingArticles } = useArticles()
  const { data: variants, isLoading: isLoadingVariants } = useArticleVariants()
  const { data: stock, isLoading: isLoadingStock } = useSellerStock(selectedSucursal?.id)

  return (
    <PageTemplateSimple
      title="Stock"
      description="Gestion de stock por sucursal."
    >

      <Card className="mt-2 bg-card p-3.5 sm:mt-3 sm:p-5">
        {selectedSucursal ? (
          <SellerStockEditor
            articles={articles}
            isLoading={isLoadingArticles || isLoadingVariants || isLoadingStock}
            sucursal={selectedSucursal}
            stock={stock}
            variants={variants}
            onBack={() => setSelectedSucursal(null)}
          />
        ) : (
          <SellersStockList
            isLoading={isLoadingSucursales}
            sucursales={sucursales}
            onSelect={setSelectedSucursal}
          />
        )}
      </Card>
    </PageTemplateSimple>
  )
}
