import { WalletCards } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const cashRoutes: AppRoute[] = [{
  path: 'caja',
  meta: { name: 'Caja', description: 'Movimientos y arqueos de efectivo', icon: WalletCards },
  children: [
    { path: 'mi-caja', meta: { name: 'Mi caja', description: 'Entradas y gastos del día', permissions: ['vendedor'], lazy: () => import('./pages/MyCashPage') } },
    { path: 'arqueos', meta: { name: 'Arqueos', description: 'Resumen diario por vendedor', permissions: ['admin'], lazy: () => import('./pages/CashAuditsPage') } },
  ],
}]
