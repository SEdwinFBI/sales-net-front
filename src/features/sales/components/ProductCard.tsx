import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FC } from "react"
import type { Product } from "@/features/sales/types/sales"

type Props = {
    item: Product
    onClick?: () => void
}

const ProductCard: FC<Props> = ({ item, onClick }) => {
    const maxPrice = item.variants.length > 1
        ? Math.max(...item.variants.map(v => v.price))
        : item.variants[0]?.price
    const hasPriceRange = item.variants.length > 1 && item.variants[0]?.price !== maxPrice

    return (
        <Card className="bg-white" onClick={onClick}>
            <img className="h-40 lg:h-50 w-full object-cover object-center" src={item.image} />
            <CardHeader>
                <Badge variant="secondary">{item.category}</Badge>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="h-10">
                    <div>
                        <div className="flex items-center gap-2 text-xs">
                            <small className="text-stone-400">
                                Desde Q.{item.variants[0]?.price}
                                {hasPriceRange && <> a Q.{maxPrice} </>}
                                en stock {item.variants.reduce((s, v) => s + v.stock, 0)}
                            </small>
                        </div>
                        <div className="grid grid-cols-4 gap-1 mt-1">
                            {item.variants.map(v => (
                                <Badge key={v.id} variant={v.stock > 0 ? 'default' : 'secondary'}>
                                    {v.size}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
    )
}

export default ProductCard
