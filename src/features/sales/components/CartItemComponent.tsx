import type { FC } from "react"
import type { CartItem } from "../types/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/helpers/money"


type CartItemProps = {
    item: CartItem,
    onRemove: (id: string) => void,
    onIncrease: (id: string) => void,
    onDecrease: (id: string) => void,
    onSetQty: (id: string, qty: number) => void,
}

const CartItemComponent: FC<CartItemProps> = ({ item, onRemove, onIncrease, onDecrease, onSetQty }) => {
    const precioFinal = item.discount > 0
        ? item.price - item.discount
        : item.price
    const subtotal = precioFinal * item.qty
    const handleQtyChange = (value: string) => {
        const nextQty = Number(value)

        if (!Number.isFinite(nextQty)) return

        onSetQty(item.id, nextQty)
    }

    return (
        <div
            key={item.id}
            className="grid gap-1 rounded-[1rem] border border-border/60 p-4"
        >
            <div className="flex items-start justify-between gap-1">
                <div>
                    <p className="font-semibold">{item.name} - {item.size}</p>
                    <p className="text-sm text-muted-foreground">
                        {item.category}
                    </p>
                </div>

                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onRemove(item.id)}
                >
                    <Trash2 />
                </Button>
            </div>

            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onDecrease(item.id)}
                    >
                        <Minus />
                    </Button>
                    <Input
                        aria-label={`Cantidad de ${item.name}`}
                        className="h-8 w-16 rounded-lg px-2 text-center font-medium"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={item.stock}
                        step={1}
                        value={item.qty}
                        onChange={(event) => handleQtyChange(event.target.value)}
                    />
                    <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onIncrease(item.id)}
                        disabled={item.qty >= item.stock}
                    >
                        <Plus />
                    </Button>
                </div>

                <div className="text-left min-[420px]:text-right">
                    {item.discount > 0 ? (
                        <>
                            <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency(item.price)} c/u
                            </p>
                            <p className="text-xs text-successful font-medium">
                                {formatCurrency(precioFinal)} c/u (-{formatCurrency(item.discount)} desc)
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)} c/u
                        </p>
                    )}
                    <p className="font-semibold text-primary">
                        {formatCurrency(subtotal)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CartItemComponent;
