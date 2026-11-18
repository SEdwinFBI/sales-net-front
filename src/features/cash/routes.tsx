import { WalletCards } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const cashRoutes: AppRoute[] = [{
  path: 'caja',
  meta: { name: 'Caja', description: 'Movimientos y arqueos de efectivo', icon: WalletCards },
  children: [
    { path: 'mi-caja', meta: { name: 'Mi caja', description: 'Entradas y gastos del día', permissions: ['vendedor'], agentHint: 'Mi caja: ver entradas y gastos del dia y abrir el formulario para registrar un movimiento.', lazy: () => import('./pages/MyCashPage') } },
    { path: 'arqueos', meta: { name: 'Arqueos', description: 'Resumen diario por vendedor', permissions: ['admin'], agentHint: 'Caja de cada sucursal (arqueos): elegir sucursal, luego vendedor, y ver sus cajas por dia y su detalle; filtrar fechas; PDF.', lazy: () => import('./pages/CashAuditsPage') } },
  ],
}]
