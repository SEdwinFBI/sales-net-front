import { ArrowDownToLine, ArrowUpFromLine, Banknote, WalletCards } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/helpers/money'
import type { Caja } from '../types/cash'

export function CashSummary({ caja }: { caja: Caja }) {
  const items = [
    { label: 'Entradas', value: caja.entradas, icon: ArrowDownToLine },
    { label: 'Gastos', value: caja.salidas, icon: ArrowUpFromLine },
    { label: 'Ventas en efectivo', value: caja.ventas_efectivo, icon: Banknote },
    { label: 'Efectivo esperado', value: caja.efectivo_esperado, icon: WalletCards },
  ]
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {items.map(({ label, value, icon: Icon }) => <Card key={label} className="py-4">
      <CardContent className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{formatCurrency(Number(value))}</p></div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div>
      </CardContent>
    </Card>)}
  </div>
}
