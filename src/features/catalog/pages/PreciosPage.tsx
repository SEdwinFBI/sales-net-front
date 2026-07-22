import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { useUsuarios } from '@/features/adminUsuarios/hooks/useUsuarios'
import MayoreoTiersEditor from '../components/MayoreoTiersEditor'
import SellersStockList from '../components/SellersStockList'
import UserPricingEditor from '../components/UserPricingEditor'
import { useArticles } from '../hooks/useArticles'
import { useMayoreoTiers } from '../hooks/useMayoreoTiers'
import { useUserPricing } from '../hooks/useUserPricing'

export default function PreciosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedSeller, setSelectedSeller] = useState<Usuario | null>(null)
  const [activeTab, setActiveTab] = useState('precios')
  const { data: users, isLoading: isLoadingUsers } = useUsuarios()
  const { data: articles } = useArticles()
  const { data: pricing, isLoading: isLoadingPricing } = useUserPricing(selectedSeller?.id)
  const { tiers } = useMayoreoTiers(selectedSeller?.id)

  const sellers = useMemo(
    () => users.filter((user) => user.role === 'vendedor'),
    [users]
  )

  // Deep-link: /catalogo/precios?usuario=5&articulo=12
  const usuarioParam = Number(searchParams.get('usuario')) || undefined
  const articuloParam = Number(searchParams.get('articulo')) || undefined

  useEffect(() => {
    if (!usuarioParam || selectedSeller || sellers.length === 0) return
    const seller = sellers.find((user) => user.id === usuarioParam)
    if (seller) setSelectedSeller(seller)
  }, [usuarioParam, sellers, selectedSeller])

  const handleSelectSeller = (seller: Usuario) => {
    setSelectedSeller(seller)
    setSearchParams({ usuario: String(seller.id) }, { replace: true })
  }

  const handleBack = () => {
    setSelectedSeller(null)
    setSearchParams({}, { replace: true })
  }

  return (
    <PageTemplateSimple
      title="Precios y descuentos"
      description="Precio, regla individual y regla mayorista por usuario."
    >
      <Card className="mt-2 bg-card p-3.5 sm:mt-3 sm:p-5">
        {selectedSeller ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
            <TabsList>
              <TabsTrigger value="precios">Precios por artículo</TabsTrigger>
              <TabsTrigger value="mayoreo">Mayoreo</TabsTrigger>
            </TabsList>
            <TabsContent value="precios">
              <UserPricingEditor
                articles={articles}
                seller={selectedSeller}
                pricing={pricing}
                tiers={tiers}
                isLoading={isLoadingPricing}
                focusArticleId={articuloParam}
                onBack={handleBack}
              />
            </TabsContent>
            <TabsContent value="mayoreo">
              <MayoreoTiersEditor
                seller={selectedSeller}
                onGoToPrecios={() => setActiveTab('precios')}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <SellersStockList
            isLoading={isLoadingUsers}
            sellers={sellers}
            onSelect={handleSelectSeller}
          />
        )}
      </Card>
    </PageTemplateSimple>
  )
}
