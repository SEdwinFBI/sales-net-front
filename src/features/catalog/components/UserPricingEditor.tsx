import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import type { Usuario } from '@/features/adminUsuarios/types/usuario-types'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/helpers/money'
import { useDeleteUserPricing } from '../hooks/useDeleteUserPricing'
import { useSaveUserPricing } from '../hooks/useSaveUserPricing'
import type { Article } from '../types/article-types'
import type { MayoreoTier, SaveUserPricingItem, UserVariantPricing } from '../types/pricing-types'
import { validateTiers, variantPricingRowSchema } from '../utils/pricing-schema'
import ArticleImage from './ArticleImage'

const pageSize = 8

type TierDraft = { desde: string; hasta: string; descuento: string }

/** Campos editables de la fila; siempre strings de input (vacío = heredar/default). */
type DraftRow = {
  precio: string
  tiers: TierDraft[]
  descuentoMayorista: string
}

type TierErrors = Partial<Record<'desde' | 'hasta' | 'descuento', string>>
type RowErrors = Partial<Record<'precio' | 'descuentoMayorista', string>> & {
  tiers?: Record<number, TierErrors>
  tierGlobal?: string
}

type Props = {
  articles: Article[]
  seller: Usuario
  pricing: UserVariantPricing[]
  tiers: MayoreoTier[]
  isLoading: boolean
  focusArticleId?: number
  onBack: () => void
}

function tierFromServer(serverTier: { unidades_min: number; unidades_max: number | null; descuento: number }): TierDraft {
  return {
    desde: String(serverTier.unidades_min),
    hasta: serverTier.unidades_max !== null ? String(serverTier.unidades_max) : '',
    descuento: serverTier.descuento > 0 ? String(serverTier.descuento) : '',
  }
}

function serverRow(variant: UserVariantPricing): DraftRow {
  const tiers =
    variant.individual_tiers.length > 0
      ? variant.individual_tiers.map(tierFromServer)
      : [{ desde: '3', hasta: '', descuento: '' }]

  return {
    precio: variant.precio_override !== null ? String(variant.precio_override) : '',
    tiers,
    descuentoMayorista:
      variant.descuento_mayorista !== null ? String(variant.descuento_mayorista) : '',
  }
}

/** Deep compare including tiers array. */
function rowsEqual(a: DraftRow, b: DraftRow): boolean {
  if (a.precio !== b.precio) return false
  if (a.descuentoMayorista !== b.descuentoMayorista) return false
  if (a.tiers.length !== b.tiers.length) return false
  return a.tiers.every(
    (tier, index) =>
      tier.desde === b.tiers[index].desde &&
      tier.hasta === b.tiers[index].hasta &&
      tier.descuento === b.tiers[index].descuento
  )
}

const EMPTY_TIER: TierDraft = { desde: '', hasta: '', descuento: '' }

export default function UserPricingEditor({
  articles: catalogArticles,
  seller,
  pricing,
  tiers,
  isLoading,
  focusArticleId,
  onBack,
}: Props) {
  const { mutateAsync: savePricing, isPending: isSaving } = useSaveUserPricing()
  const { mutateAsync: deletePricing, isPending: isResetting } = useDeleteUserPricing()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>({})
  const [errors, setErrors] = useState<Record<number, RowErrors>>({})
  const [expandedArticles, setExpandedArticles] = useState<Record<number, boolean>>({})

  const articleImages = useMemo(
    () => new Map(catalogArticles.map((article) => [article.id, article.image])),
    [catalogArticles]
  )

  const serverRows = useMemo(() => {
    const map: Record<number, DraftRow> = {}
    for (const variant of pricing) map[variant.id_variante] = serverRow(variant)
    return map
  }, [pricing])

  // Tier derivado de referencia para el placeholder del descuento mayorista.
  const derivedTier = useMemo(
    () =>
      [...tiers]
        .filter((tier) => !tier.usar_descuento_articulo)
        .sort((a, b) => a.unidades_min - b.unidades_min)[0] ?? null,
    [tiers]
  )

  // Deep-link desde el catálogo: enfoca el artículo indicado.
  useEffect(() => {
    if (!focusArticleId || pricing.length === 0) return
    const variant = pricing.find((item) => item.id_articulo === focusArticleId)
    if (variant) {
      setSearch(variant.articulo)
      setExpandedArticles({ [focusArticleId]: true })
    }
  }, [focusArticleId, pricing])

  const getRow = (variantId: number): DraftRow =>
    drafts[variantId] ?? serverRows[variantId] ?? {
      precio: '',
      tiers: [{ desde: '3', hasta: '', descuento: '' }],
      descuentoMayorista: '',
    }

  const dirtyIds = useMemo(
    () =>
      Object.keys(drafts)
        .map(Number)
        .filter((variantId) => {
          const base = serverRows[variantId]
          return base && !rowsEqual(drafts[variantId], base)
        }),
    [drafts, serverRows]
  )

  const articles = useMemo(() => {
    const grouped = new Map<number, { id: number; title: string; image: string | null; variants: UserVariantPricing[] }>()
    for (const variant of pricing) {
      const entry = grouped.get(variant.id_articulo) ?? {
        id: variant.id_articulo,
        title: variant.articulo,
        image: articleImages.get(variant.id_articulo) ?? null,
        variants: [],
      }
      if (!entry.image) entry.image = articleImages.get(variant.id_articulo) ?? null
      entry.variants.push(variant)
      grouped.set(variant.id_articulo, entry)
    }
    return [...grouped.values()]
      .filter((article) => article.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [articleImages, pricing, search])

  const totalPages = Math.max(Math.ceil(articles.length / pageSize), 1)
  const safePage = Math.min(currentPage, totalPages)
  const paginatedArticles = articles.slice((safePage - 1) * pageSize, safePage * pageSize)

  const customizedCount = useMemo(
    () =>
      pricing.filter((variant) => {
        const row = getRow(variant.id_variante)
        return row.precio !== '' || row.descuentoMayorista !== '' ||
          row.tiers.some((t) => t.descuento !== '' || t.desde !== '3' || t.hasta !== '')
      }).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pricing, drafts, serverRows]
  )

  const setField = (variantId: number, field: 'precio' | 'descuentoMayorista', value: string) => {
    setDrafts((current) => ({
      ...current,
      [variantId]: { ...getRow(variantId), [field]: value },
    }))
    setErrors((current) => {
      if (!current[variantId]?.[field]) return current
      const next = { ...current, [variantId]: { ...current[variantId] } }
      delete (next[variantId] as Record<string, unknown>)[field]
      return next
    })
  }

  const setTierField = (
    variantId: number,
    tierIndex: number,
    field: keyof TierDraft,
    value: string
  ) => {
    setDrafts((current) => {
      const row = { ...getRow(variantId) }
      const tiers = [...row.tiers]
      tiers[tierIndex] = { ...tiers[tierIndex], [field]: value }
      return { ...current, [variantId]: { ...row, tiers } }
    })
    setErrors((current) => {
      const rowErrors = current[variantId]
      if (!rowErrors?.tiers?.[tierIndex]?.[field]) return current
      const next = { ...current, [variantId]: { ...rowErrors } }
      if (next[variantId].tiers) {
        const tierErrs = { ...next[variantId].tiers! }
        if (tierErrs[tierIndex]) {
          tierErrs[tierIndex] = { ...tierErrs[tierIndex] }
          delete tierErrs[tierIndex][field]
        }
        next[variantId].tiers = tierErrs
      }
      return next
    })
  }

  const addTier = (variantId: number) => {
    setDrafts((current) => {
      const row = { ...getRow(variantId) }
      return { ...current, [variantId]: { ...row, tiers: [...row.tiers, { ...EMPTY_TIER }] } }
    })
  }

  const removeTier = (variantId: number, tierIndex: number) => {
    setDrafts((current) => {
      const row = { ...getRow(variantId) }
      const tiers = row.tiers.filter((_, index) => index !== tierIndex)
      return {
        ...current,
        [variantId]: tiers.length > 0 ? { ...row, tiers } : { ...row, tiers: [{ ...EMPTY_TIER }] },
      }
    })
  }

  const toggleArticle = (articleId: number) => {
    setExpandedArticles((current) => ({
      ...current,
      [articleId]: !(current[articleId] ?? false),
    }))
  }

  const handleDiscard = () => {
    setDrafts({})
    setErrors({})
  }

  const handleResetRow = async (variant: UserVariantPricing) => {
    setDrafts((current) => {
      const next = { ...current }
      delete next[variant.id_variante]
      return next
    })
    if (!variant.tiene_config) return
    try {
      await deletePricing({ userId: seller.id, variantId: variant.id_variante })
      toast.success(`La talla ${variant.talla} vuelve a heredar los valores por defecto`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al restablecer la variante'))
    }
  }

  const handleSave = async () => {
    const nextErrors: Record<number, RowErrors> = {}
    const items: SaveUserPricingItem[] = []

    for (const variantId of dirtyIds) {
      const variant = pricing.find((item) => item.id_variante === variantId)
      if (!variant) continue
      const row = getRow(variantId)
      const rowErrors: RowErrors = {}

      // Validate basic fields + tier discounts
      const parsed = variantPricingRowSchema.safeParse({
        precio: row.precio,
        descuentoMayorista: row.descuentoMayorista,
        precioBase: variant.precio_base,
        tiers: row.tiers.filter((t) => t.descuento !== '' && t.desde !== ''),
      })
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const [field, ...rest] = issue.path
          if (field === 'tiers' && typeof rest[0] === 'number') {
            const tierIndex = rest[0] as number
            const tierField = rest[1] as keyof TierErrors
            rowErrors.tiers = rowErrors.tiers ?? {}
            rowErrors.tiers[tierIndex] = rowErrors.tiers[tierIndex] ?? {}
            rowErrors.tiers[tierIndex][tierField] = issue.message
          } else if (field === 'precio' || field === 'descuentoMayorista') {
            (rowErrors as Record<string, string>)[field] = issue.message
          }
        }
      }

      // Validate tier ranges
      const activeTiers = row.tiers.filter((t) => t.descuento !== '' && t.desde !== '')
      if (activeTiers.length > 0) {
        const tierErrors = validateTiers(activeTiers.map((t) => ({
          desde: t.desde || '1',
          hasta: t.hasta,
          descuento: t.descuento,
        })))
        if (tierErrors) {
          rowErrors.tiers = rowErrors.tiers ?? {}
          for (const [tierIndex, errMsg] of Object.entries(tierErrors)) {
            const idx = Number(tierIndex)
            rowErrors.tiers[idx] = rowErrors.tiers[idx] ?? {}
            rowErrors.tiers[idx].desde = errMsg
          }
        }
      }

      if (Object.keys(rowErrors).length > 0) {
        nextErrors[variantId] = rowErrors
        continue
      }

      items.push({
        id_variante: variantId,
        precio: row.precio === '' ? null : Number(row.precio),
        individual_tiers: row.tiers
          .filter((t) => t.descuento !== '' && t.desde !== '')
          .map((t) => ({
            unidades_min: Number(t.desde),
            unidades_max: t.hasta === '' ? null : Number(t.hasta),
            descuento: Number(t.descuento),
          })),
        descuento_mayorista: row.descuentoMayorista === '' ? null : Number(row.descuentoMayorista),
      })
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Revisa los campos marcados antes de guardar')
      return
    }
    if (items.length === 0) return

    try {
      await savePricing({ userId: seller.id, items })
      setDrafts({})
      toast.success(`Se guardaron los precios de ${items.length} variante(s)`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al guardar los precios'))
    }
  }

  const moneyField = (
    variantId: number,
    field: 'precio' | 'descuentoMayorista',
    value: string,
    placeholder: string,
    error?: string
  ) => (
    <div>
      <InputGroup className={cn('h-9 bg-card', error && 'border-destructive')}>
        <InputGroupAddon>Q</InputGroupAddon>
        <InputGroupInput
          aria-invalid={!!error}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setField(variantId, field, event.target.value)}
        />
      </InputGroup>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button size="icon-sm" variant="outline" onClick={onBack} aria-label="Volver a usuarios">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{seller.fullName}</p>
            <p className="text-sm text-muted-foreground">
              Precio y descuentos por talla
            </p>
          </div>
        </div>
        {customizedCount > 0 && (
          <Badge variant="outline">{customizedCount} variantes personalizadas</Badge>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar artículo..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {articles.length === 0 ? (
        <EmptyState icon={Package} title="No se encontraron artículos." />
      ) : (
        <div className="space-y-4">
          {paginatedArticles.map((article) => {
            const isExpanded = expandedArticles[article.id] ?? false
            const customized = article.variants.filter((variant) => {
              const row = getRow(variant.id_variante)
              return row.precio !== '' || row.descuentoMayorista !== '' ||
                row.tiers.some((t) => t.descuento !== '' || t.desde !== '3' || t.hasta !== '')
            }).length

            return (
              <Card
                key={article.id}
                size="sm"
                className={cn(
                  'border-l-4 bg-card p-0 shadow-sm transition-shadow hover:shadow-md',
                  customized > 0 ? 'border-l-primary' : 'border-l-border'
                )}
              >
                <div className="p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <ArticleImage
                        className="size-14 shrink-0 rounded-lg object-cover shadow-sm sm:size-16"
                        src={article.image}
                        alt={article.title}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold sm:text-base">{article.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {customized > 0
                            ? `${customized} de ${article.variants.length} tallas personalizadas`
                            : 'Hereda precios base'}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={isExpanded ? 'default' : 'outline'}
                      className="w-full justify-between sm:w-48"
                      onClick={() => toggleArticle(article.id)}
                    >
                      {isExpanded ? 'Cerrar' : 'Configurar precios'}
                      <ChevronDown className={cn('transition-transform', isExpanded && 'rotate-180')} />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 grid gap-3 xl:grid-cols-[11rem_minmax(0,1fr)]">
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <ArticleImage
                          className="aspect-square w-full rounded-md object-cover shadow-sm"
                          src={article.image}
                          alt={article.title}
                        />
                        <p className="mt-2 line-clamp-2 text-sm font-semibold">{article.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {customized > 0
                            ? `${customized} talla${customized === 1 ? '' : 's'} personalizada${customized === 1 ? '' : 's'}`
                            : 'Sin precios personalizados'}
                        </p>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="hidden gap-2 bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[4.5rem_5.5rem_minmax(6rem,1fr)_minmax(12rem,1fr)_minmax(6rem,1fr)_2.5rem]">
                          <span>Talla</span>
                          <span>Base</span>
                          <span>Precio propio</span>
                          <span>Descuentos individuales</span>
                          <span>Desc. mayorista</span>
                          <span />
                        </div>
                        <div className="divide-y divide-border">
                          {article.variants
                            .slice()
                            .sort((a, b) => a.talla.localeCompare(b.talla, undefined, { numeric: true }))
                            .map((variant) => {
                            const row = getRow(variant.id_variante)
                            const rowErrors = errors[variant.id_variante] ?? {}
                            const isCustomized =
                              row.precio !== '' ||
                              row.descuentoMayorista !== '' ||
                              row.tiers.some((t) => t.descuento !== '' || t.desde !== '3' || t.hasta !== '')

                            const firstTierDescuento = row.tiers.length > 0 ? Number(row.tiers[0].descuento || 0) : 0
                            const derivedPlaceholder =
                              derivedTier && firstTierDescuento > 0
                                ? `${(firstTierDescuento * Number(derivedTier.factor_individual)).toFixed(2)} (derivado)`
                                : 'Derivado del individual'

                            return (
                              <div
                                key={variant.id_variante}
                                className="divide-y divide-border p-3 transition-colors focus-within:bg-primary/5 lg:px-4"
                              >
                                <div className="grid gap-2 pb-3 lg:grid-cols-[4.5rem_5.5rem_minmax(6rem,1fr)_minmax(12rem,1fr)_minmax(6rem,1fr)_2.5rem] lg:items-start">
                                  {/* Talla + Badge */}
                                  <div className="flex items-center justify-between gap-2 lg:block lg:pt-2">
                                    <span className="text-sm font-semibold">{variant.talla}</span>
                                    {isCustomized && (
                                      <Badge className="lg:mt-1" variant="secondary">Propio</Badge>
                                    )}
                                  </div>
                                  {/* Precio base */}
                                  <p className="text-sm text-muted-foreground lg:pt-2.5">
                                    <span className="mr-1 lg:hidden">Precio base:</span>
                                    {formatCurrency(variant.precio_base)}
                                  </p>
                                  {/* Precio propio */}
                                  <div>
                                    <p className="mb-1 text-xs text-muted-foreground lg:hidden">Precio propio</p>
                                    {moneyField(
                                      variant.id_variante,
                                      'precio',
                                      row.precio,
                                      variant.precio_base.toFixed(2),
                                      rowErrors.precio
                                    )}
                                  </div>

                                  {/* Tiers individuales */}
                                  <div>
                                    <p className="mb-1 text-xs text-muted-foreground lg:hidden">
                                      Descuentos individuales
                                    </p>
                                    <div className="space-y-2">
                                      {row.tiers.map((tier, tierIndex) => {
                                        const tierErr = rowErrors.tiers?.[tierIndex]
                                        return (
                                          <div key={tierIndex} className="flex flex-wrap items-end gap-1.5">
                                            <div className="min-w-0 flex-1">
                                              <p className="mb-0.5 text-[10px] text-muted-foreground">Desde</p>
                                              <Input
                                                aria-invalid={!!tierErr?.desde}
                                                className={cn('h-8 bg-card', tierErr?.desde && 'border-destructive')}
                                                inputMode="numeric"
                                                placeholder="3"
                                                value={tier.desde}
                                                onChange={(event) =>
                                                  setTierField(variant.id_variante, tierIndex, 'desde', event.target.value)
                                                }
                                              />
                                              {tierErr?.desde && (
                                                <p className="mt-0.5 text-[10px] text-destructive">{tierErr.desde}</p>
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="mb-0.5 text-[10px] text-muted-foreground">Hasta</p>
                                              <Input
                                                aria-invalid={!!tierErr?.hasta}
                                                className={cn('h-8 bg-card', tierErr?.hasta && 'border-destructive')}
                                                inputMode="numeric"
                                                placeholder="∞"
                                                value={tier.hasta}
                                                onChange={(event) =>
                                                  setTierField(variant.id_variante, tierIndex, 'hasta', event.target.value)
                                                }
                                              />
                                              {tierErr?.hasta && (
                                                <p className="mt-0.5 text-[10px] text-destructive">{tierErr.hasta}</p>
                                              )}
                                            </div>
                                            <div className="min-w-0 max-w-28 flex-[2]">
                                              <p className="mb-0.5 text-[10px] text-muted-foreground">Q desc</p>
                                              <InputGroup className={cn('h-8 bg-card', tierErr?.descuento && 'border-destructive')}>
                                                <InputGroupAddon className="text-xs">Q</InputGroupAddon>
                                                <InputGroupInput
                                                  aria-invalid={!!tierErr?.descuento}
                                                  className="h-8"
                                                  inputMode="decimal"
                                                  placeholder="0.00"
                                                  value={tier.descuento}
                                                  onChange={(event) =>
                                                    setTierField(variant.id_variante, tierIndex, 'descuento', event.target.value)
                                                  }
                                                />
                                              </InputGroup>
                                              {tierErr?.descuento && (
                                                <p className="mt-0.5 text-[10px] text-destructive">{tierErr.descuento}</p>
                                              )}
                                            </div>
                                            <Button
                                              size="icon-xs"
                                              variant="ghost"
                                              className="mb-px shrink-0"
                                              aria-label="Eliminar rango"
                                              onClick={() => removeTier(variant.id_variante, tierIndex)}
                                            >
                                              <Trash2 className="size-3.5" />
                                            </Button>
                                          </div>
                                        )
                                      })}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-7 w-full gap-1 text-xs"
                                        onClick={() => addTier(variant.id_variante)}
                                      >
                                        <Plus className="size-3" />
                                        Agregar rango
                                      </Button>
                                      {rowErrors.tierGlobal && (
                                        <p className="text-xs text-destructive">{rowErrors.tierGlobal}</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Descuento mayorista */}
                                  <div>
                                    <p className="mb-1 text-xs text-muted-foreground lg:hidden">
                                      Descuento mayorista (por unidad)
                                    </p>
                                    {moneyField(
                                      variant.id_variante,
                                      'descuentoMayorista',
                                      row.descuentoMayorista,
                                      derivedPlaceholder,
                                      rowErrors.descuentoMayorista
                                    )}
                                  </div>

                                  {/* Reset */}
                                  <div className="flex justify-end lg:pt-1">
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      aria-label={`Restablecer talla ${variant.talla}`}
                                      disabled={(!isCustomized && !variant.tiene_config) || isResetting}
                                      onClick={() => handleResetRow(variant)}
                                    >
                                      <RotateCcw />
                                    </Button>
                                  </div>
                                </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}

          {articles.length > pageSize && (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {articles.length} artículos - Página {safePage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Página anterior"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Página siguiente"
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {dirtyIds.length > 0 && (
        <div className="sticky bottom-2 z-10">
          <div className="flex flex-col items-stretch gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">
              {dirtyIds.length} cambio{dirtyIds.length === 1 ? '' : 's'} sin guardar
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDiscard} disabled={isSaving}>
                Descartar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
