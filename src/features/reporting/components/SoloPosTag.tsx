import { cn } from '@/lib/utils'

/** Aviso de que una lista o cifra solo cuenta las ventas del POS (las registradas en la ficha del cliente no tienen artículos). */
export default function SoloPosTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground',
        className,
      )}
    >
      Solo ventas POS (con artículos)
    </span>
  )
}
