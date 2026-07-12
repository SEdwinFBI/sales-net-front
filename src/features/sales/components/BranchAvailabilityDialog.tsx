import { useEffect, useState } from 'react'
import { Search, Store, RotateCcw, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getStockTextClass } from '@/lib/stock-status'
import { useArticles } from '../hooks/useArticles'
import { useBranchAvailability } from '../hooks/useBranchAvailability'
import { useSalesStore } from '../store/useSalesStore'

/**
 * Dialog para consultar existencias de un artículo en otras tiendas
 * (cada tienda = un usuario/vendedor). Dos modos:
 * - Búsqueda (articleId null): buscador de artículo para consulta rápida.
 * - Matriz (articleId definido): tabla tallas × tiendas con cantidades.
 */
const BranchAvailabilityDialog = () => {
    const { open, articleId, highlightVariantId } = useSalesStore((state) => state.branchAvailability)
    const closeBranchAvailability = useSalesStore((state) => state.closeBranchAvailability)

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) closeBranchAvailability() }}>
            <DialogContent className="sm:max-w-xl">
                {articleId == null
                    ? <ArticleSearchMode />
                    : <AvailabilityMatrixMode articleId={articleId} highlightVariantId={highlightVariantId} />}
            </DialogContent>
        </Dialog>
    )
}

const ArticleSearchMode = () => {
    const setBranchAvailabilityArticle = useSalesStore((state) => state.setBranchAvailabilityArticle)
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const { articles, isLoading } = useArticles(1, 10, debouncedSearch)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
        return () => clearTimeout(timer)
    }, [searchInput])

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Store className="size-4" />
                    Existencias en tiendas
                </DialogTitle>
                <DialogDescription>
                    Busca un artículo para ver sus tallas y en qué tiendas hay existencia.
                </DialogDescription>
            </DialogHeader>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    autoFocus
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    className="pl-9"
                />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border">
                {isLoading ? (
                    <div className="space-y-2 p-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-full" />
                        ))}
                    </div>
                ) : articles.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                        {debouncedSearch ? 'Sin coincidencias' : 'No hay artículos disponibles'}
                    </p>
                ) : (
                    <ul className="divide-y">
                        {articles.map((article) => (
                            <li key={article.id}>
                                <button
                                    type="button"
                                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-accent"
                                    onClick={() => setBranchAvailabilityArticle(article.id)}
                                >
                                    <span className="flex-1 truncate text-sm">{article.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {article.variants.length} talla{article.variants.length === 1 ? '' : 's'}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}

type MatrixProps = {
    articleId: number
    highlightVariantId: number | null
}

const AvailabilityMatrixMode = ({ articleId, highlightVariantId }: MatrixProps) => {
    const setBranchAvailabilityArticle = useSalesStore((state) => state.setBranchAvailabilityArticle)
    const { availability, isLoading, isError, refetch } = useBranchAvailability(articleId)

    const otherStoresWithStock = availability?.sucursales.some((s) => !s.es_propia && s.total > 0) ?? false

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Store className="size-4" />
                    {availability?.articulo.nombre ?? 'Existencias en tiendas'}
                </DialogTitle>
                <DialogDescription>
                    Existencias por talla en cada tienda.
                </DialogDescription>
            </DialogHeader>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                    ))}
                </div>
            ) : isError || !availability ? (
                <div className="flex flex-col items-center gap-3 py-6">
                    <p className="text-sm text-muted-foreground">No se pudieron cargar las existencias.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RotateCcw className="size-4" />
                        Reintentar
                    </Button>
                </div>
            ) : availability.tallas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    Este artículo no tiene tallas activas.
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tienda</TableHead>
                                    {availability.tallas.map((talla) => (
                                        <TableHead
                                            key={talla.id_variante}
                                            className={cn(
                                                'text-center',
                                                talla.id_variante === highlightVariantId && 'bg-primary/10 font-bold'
                                            )}
                                        >
                                            {talla.talla}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availability.sucursales.map((sucursal) => (
                                    <TableRow key={sucursal.id_usuario}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm">
                                                    {sucursal.nombre || sucursal.username}
                                                </span>
                                                {sucursal.es_propia && (
                                                    <Badge variant="secondary">Tu tienda</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        {availability.tallas.map((talla) => {
                                            const cantidad = sucursal.existencias[String(talla.id_variante)] ?? 0
                                            return (
                                                <TableCell
                                                    key={talla.id_variante}
                                                    className={cn(
                                                        'text-center font-medium tabular-nums',
                                                        getStockTextClass(cantidad),
                                                        talla.id_variante === highlightVariantId && 'bg-primary/10'
                                                    )}
                                                >
                                                    {cantidad > 0 ? cantidad : '—'}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {!otherStoresWithStock && (
                        <p className="text-center text-sm text-muted-foreground">
                            No hay existencias de este artículo en otras tiendas.
                        </p>
                    )}
                </>
            )}

            <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setBranchAvailabilityArticle(null)}
            >
                <ArrowLeft className="size-4" />
                Buscar otro artículo
            </Button>
        </>
    )
}

export default BranchAvailabilityDialog
