import type { FC } from "react"
import type { CartItem } from "../types/sales"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/helpers/money"


type CartItemProps = {
    item: CartItem,
    onRemove: (id: string) => void,
    onIncrease: (id: string) => void,
    onDecrease: (id: string) => void,
}

const CartItemComponent: FC<CartItemProps> = ({ item, onRemove, onIncrease, onDecrease }) => {
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

            <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                    <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onDecrease(item.id)}
                    >
                        <Minus />
                    </Button>
                    <span className="min-w-8 text-center font-medium">
                        {item.qty}
                    </span>
                    <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => onIncrease(item.id)}
                    >
                        <Plus />
                    </Button>
                </div>

                <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} c/u
                    </p>
                    <p className="font-semibold text-primary">
                        {formatCurrency(item.price * item.qty)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CartItemComponent;
