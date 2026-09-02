import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSucursales, type Sucursal } from '@/features/admin'
import MayoreoTiersEditor from '../components/MayoreoTiersEditor'
import SellersStockList from '../components/SellersStockList'
import UserPricingEditor from '../components/UserPricingEditor'
import { useArticles } from '../hooks/useArticles'
import { useMayoreoTiers } from '../hooks/useMayoreoTiers'
import { useUserPricing } from '../hooks/useUserPricing'

export default function PreciosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null)
  const [activeTab, setActiveTab] = useState('precios')
  const { data: sucursales, isLoading: isLoadingSucursales } = useSucursales()
  const { data: articles } = useArticles()
  const { data: pricing, isLoading: isLoadingPricing } = useUserPricing(selectedSucursal?.id)
  const { tiers } = useMayoreoTiers(selectedSucursal?.id)

  // Deep-link: /catalogo/precios?sucursal=5&articulo=12
  const sucursalParam = Number(searchParams.get('sucursal')) || undefined
  const articuloParam = Number(searchParams.get('articulo')) || undefined

  useEffect(() => {
    if (!sucursalParam || selectedSucursal || sucursales.length === 0) return
    const sucursal = sucursales.find((s) => s.id === sucursalParam)
    if (sucursal) setSelectedSucursal(sucursal)
  }, [sucursalParam, sucursales, selectedSucursal])

  const handleSelectSucursal = (sucursal: Sucursal) => {
    setSelectedSucursal(sucursal)
    setSearchParams({ sucursal: String(sucursal.id) }, { replace: true })
  }

  const handleBack = () => {
    setSelectedSucursal(null)
    setSearchParams({}, { replace: true })
  }

  return (
    <PageTemplateSimple
      title="Precios y descuentos"
      description="Precio, regla individual y regla mayorista por sucursal."
    >
      <Card className="mt-2 bg-card p-3.5 sm:mt-3 sm:p-5">
        {selectedSucursal ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
            <TabsList>
              <TabsTrigger value="precios">Precios por artículo</TabsTrigger>
              <TabsTrigger value="mayoreo">Mayoreo</TabsTrigger>
            </TabsList>
            <TabsContent value="precios">
              <UserPricingEditor
                articles={articles}
                sucursal={selectedSucursal}
                pricing={pricing}
                tiers={tiers}
                isLoading={isLoadingPricing}
                focusArticleId={articuloParam}
                onBack={handleBack}
              />
            </TabsContent>
            <TabsContent value="mayoreo">
              <MayoreoTiersEditor
                sucursal={selectedSucursal}
                onGoToPrecios={() => setActiveTab('precios')}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <SellersStockList
            isLoading={isLoadingSucursales}
            sucursales={sucursales}
            onSelect={handleSelectSucursal}
          />
        )}
      </Card>
    </PageTemplateSimple>
  )
}
