import { WalletCards } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const cashRoutes: AppRoute[] = [{
  path: 'caja',
  meta: { name: 'Caja', description: 'Movimientos y arqueos de efectivo', icon: WalletCards },
  children: [
    { path: 'mi-caja', meta: { name: 'Mi caja', description: 'Entradas y gastos del día', permissions: ['vendedor'], agentHint: 'Mi caja: ver entradas y gastos del dia y abrir el formulario para registrar un movimiento.', lazy: () => import('./pages/MyCashPage') } },
    { path: 'arqueos', meta: { name: 'Arqueos', description: 'Resumen diario por vendedor', permissions: ['admin'], agentHint: 'Arqueos de caja: filtrar por fecha, ver el resumen por sucursal o vendedor, el detalle de una caja y descargar el reporte.', lazy: () => import('./pages/CashAuditsPage') } },
  ],
}]
