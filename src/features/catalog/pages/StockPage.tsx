import { useState } from 'react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { useSucursales, type Sucursal } from '@/features/admin'
import SellerStockEditor from '../components/SellerStockEditor'
import SellersStockList from '../components/SellersStockList'
import { useArticles } from '../hooks/useArticles'
import { useArticleVariants } from '../hooks/useArticleVariants'
import { useSellerStock } from '../hooks/useSellerStock'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { buildSucursalPickerTools } from '../agent/stock-tools'

export default function StockPage() {
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null)
  const { data: sucursales, isLoading: isLoadingSucursales } = useSucursales()
  const { data: articles, isLoading: isLoadingArticles } = useArticles()
  const { data: variants, isLoading: isLoadingVariants } = useArticleVariants()
  const { data: stock, isLoading: isLoadingStock } = useSellerStock(selectedSucursal?.id)

  // Mientras se ve la lista de sucursales, el agente puede leerla y abrir una (el editor registra sus propias tools).
  useAgentTools(
    'stock-sucursales',
    selectedSucursal
      ? null
      : buildSucursalPickerTools(
          {
            getSucursales: () => sucursales,
            isLoading: () => isLoadingSucursales,
            select: (id) => {
              const sucursal = sucursales.find((s) => s.id === id)
              if (sucursal) setSelectedSucursal(sucursal)
            },
          },
          { leer: 'leer_sucursales_stock', abrir: 'abrir_stock_sucursal', area: 'el stock' },
        ),
  )

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
