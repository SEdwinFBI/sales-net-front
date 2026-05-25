import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { useSaveSellerStock } from '../hooks/useSaveSellerStock'
import type { Article } from '../types/article-types'
import type { ArticleSize, ArticleVariant } from '../types/article-variant-types'
import type { StockAssignment } from '../types/stock-types'

const sizes: ArticleSize[] = ['1', '2', '3', '4', '5', '6']

type Props = {
  articles: Article[]
  isLoading: boolean
  seller: Usuario
  stock: StockAssignment[]
  variants: ArticleVariant[]
  onBack: () => void
}

export default function SellerStockEditor({
  articles,
  isLoading,
  seller,
  stock,
  variants,
  onBack,
}: Props) {
  const { mutateAsync: saveStock, isPending } = useSaveSellerStock()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    const nextQuantities = stock.reduce<Record<string, number>>((acc, item) => {
      acc[item.variantId] = item.quantity
      return acc
    }, {})

    setQuantities(nextQuantities)
  }, [stock])

  const rows = useMemo(
    () =>
      [...articles]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((article) => ({
          article,
          sizes: sizes.map((size) => {
            const variant = variants.find(
              (item) => item.articleId === article.id && item.size === size
            )

            return {
              size,
              variant,
              quantity: variant ? quantities[variant.id] ?? 0 : 0,
            }
          }),
        })),
    [articles, quantities, variants]
  )

  const handleQuantityChange = (variantId: string, value: string) => {
    const quantity = Math.max(0, Number(value) || 0)
    setQuantities((current) => ({ ...current, [variantId]: quantity }))
  }

  const handleSave = async () => {
    const items = variants.map((variant) => ({
      variantId: variant.id,
      quantity: quantities[variant.id] ?? 0,
    }))

    try {
      await saveStock({ sellerId: seller.id, items })
      toast.success('Stock guardado correctamente')
    } catch {
      toast.error('Error al guardar el stock')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="icon-sm" variant="outline" onClick={onBack}>
            <ArrowLeft />
          </Button>
          <div>
            <p className="text-sm font-semibold text-primary">{seller.fullName}</p>
            <p className="text-sm text-muted-foreground">Stock asignado por talla</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending || isLoading}>
          <Save />
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Articulo</TableHead>
              {sizes.map((size) => (
                <TableHead key={size} className="text-center">
                  Talla {size}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Cargando stock...
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.article.id} className="focus-within:bg-primary/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        className="size-12 rounded-lg object-cover shadow-sm"
                        src={row.article.image}
                        alt={row.article.title}
                      />
                      <span className="font-medium">{row.article.title}</span>
                    </div>
                  </TableCell>
                  {row.sizes.map(({ quantity, size, variant }) => (
                    <TableCell key={size} className="min-w-24">
                      {variant ? (
                        <Input
                          className="mx-auto max-w-20 text-center transition-shadow focus-visible:shadow-sm"
                          min={0}
                          type="number"
                          value={quantity}
                          onChange={(event) => handleQuantityChange(variant.id, event.target.value)}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">-</div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
