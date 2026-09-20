import { Badge } from '@/components/ui/badge'
import type { TipoCliente } from '../types/clientes'
import { Tag, Wallet } from 'lucide-react'

export default function TipoClienteBadge({ tipo }: { tipo: TipoCliente }) {
  const soloPrecios = tipo === 'SOLO_PRECIOS'
  const Icon = soloPrecios ? Tag : Wallet
  return (
    <Badge variant="outline" className={soloPrecios
      ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}>
      <Icon aria-hidden="true" />
      {soloPrecios ? 'Solo precios' : 'Crédito y precios'}
    </Badge>
  )
}
