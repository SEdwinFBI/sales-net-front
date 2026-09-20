import { useState, useDeferredValue } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { formatCurrency } from '@/helpers/money'
import { useArticles } from '@/features/sales/hooks/useArticles'
import { useCustomerPricesStore } from '../store/useCustomerPricesStore'
import type { CustomerProductPrice } from '../types/customer-prices'
import type { Product, ProductVariant } from '@/features/sales/types/sales'
import { toast } from 'sonner'
import { Plus, Search, Check, Tag } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  customerId: number
  customerName: string
}

export default function AddCustomerPriceDialog({
  open,
  onClose,
  customerId,
  customerName,
}: Props) {
  const savePrices = useCustomerPricesStore((state) => state.savePrices)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())

  const { articles, isLoading } = useArticles(1, 15, deferredSearch)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [precioPactado, setPrecioPactado] = useState('')

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    if (product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
      setPrecioPactado(String(product.variants[0].price))
    } else {
      setSelectedVariant(null)
      setPrecioPactado('')
    }
  }

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    if (!precioPactado) {
      setPrecioPactado(String(variant.price))
    }
  }

  const handleSave = () => {
    if (!selectedProduct || !selectedVariant) {
      toast.warning('Selecciona un artículo y su talla.')
      return
    }

    const priceNum = Number(precioPactado)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error('Ingresa un precio mayor que cero.')
      return
    }

    const ahorro = Math.max(0, selectedVariant.price - priceNum)
    const newPriceItem: CustomerProductPrice = {
      id: `${customerId}::${selectedVariant.id}`,
      customerId,
      customerName,
      variantId: selectedVariant.id,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantSize: selectedVariant.size,
      precioPactado: priceNum,
      precioCatalogo: selectedVariant.price,
      descuentoAplicado: ahorro,
      tipoDescuentoOrigen: 'MANUAL',
      fechaRegistro: new Date().toISOString(),
    }

    savePrices([newPriceItem])
    toast.success(
      `Precio de ${selectedProduct.name} (${selectedVariant.size}) asignado a ${formatCurrency(priceNum)}`
    )
    setSelectedProduct(null)
    setSelectedVariant(null)
    setPrecioPactado('')
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="size-5" />
            </div>
            <div>
              <DialogTitle>Asignar precio al cliente</DialogTitle>
              <DialogDescription>
                Selecciona un artículo y define su precio para {customerName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Buscador de artículo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. Busca un artículo
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/50 bg-card">
              {isLoading ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Buscando artículos…</p>
              ) : articles.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">No se encontraron artículos</p>
              ) : (
                articles.map((art) => {
                  const isSelected = selectedProduct?.id === art.id
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => handleSelectProduct(art)}
                      className={`flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors hover:bg-muted/40 cursor-pointer ${
                        isSelected ? 'bg-primary/10 font-semibold text-primary' : ''
                      }`}
                    >
                      <div className="truncate min-w-0 flex-1">
                        <p className="truncate">{art.name}</p>
                        <p className="text-[11px] text-muted-foreground">{art.category} · {art.variants.length} tallas</p>
                      </div>
                      {isSelected && <Check className="size-4 text-primary shrink-0 ml-2" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Selector de Variante / Talla */}
          {selectedProduct && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2. Selecciona la talla
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id
                  return (
                    <Button
                      key={v.id}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleSelectVariant(v)}
                      className="text-xs"
                    >
                      {v.size} — {formatCurrency(v.price)}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Precio pactado */}
          {selectedVariant && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedProduct?.name}</p>
                  <p className="text-muted-foreground">Talla {selectedVariant.size}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Precio de catálogo</p>
                  <p className="font-medium text-foreground">{formatCurrency(selectedVariant.price)}</p>
                </div>
              </div>

              <Field>
                <FieldLabel>Precio del cliente (Q)</FieldLabel>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={precioPactado}
                    onChange={(e) => setPrecioPactado(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
              </Field>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selectedProduct || !selectedVariant || !precioPactado}
          >
            Guardar precio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
