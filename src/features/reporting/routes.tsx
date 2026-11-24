import { BarChart3 } from 'lucide-react'
import type { AppRoute } from '@/lib/app-routes'

export const reportingRoutes: AppRoute[] = [
  {
    path: 'reportes',
    meta: {
      name: 'Reportes',
      description: 'Reportes del sistema',
      icon: BarChart3,
    },
    children: [
      {
        path: 'dashboard',
        meta: {
          name: 'Dashboard',
          description: 'Panel de control',
          permissions: ['admin'],
          agentHint: 'Dashboard (resumen): ventas global, POS y cliente, mas vendidos, stock bajo y deudores; filtrar por fechas, sucursal, articulo y talla.',
          lazy: () => import('./pages/DashboardPage'),
        },
      },
      {
        path: 'ventas',
        meta: {
          name: 'Ventas',
          description: 'Reporte de ventas',
          permissions: ['admin'],
          agentHint: 'Reporte de ventas: totales global, POS y cliente; por variante (solo POS) o sucursal; filtrar por fechas, articulo, talla y sucursal; PDF.',
          lazy: () => import('./pages/ReporteVentasPage'),
        },
      },
      {
        path: 'deudores',
        meta: {
          name: 'Deudores',
          description: 'Reporte de deudores',
          permissions: ['admin'],
          agentHint: 'Deudores = clientes con deuda o saldo pendiente: filtrar por nombre del cliente o lugar, leer y descargar el PDF.',
          lazy: () => import('./pages/ReporteDeudoresPage'),
        },
      },
      {
        path: 'cobros',
        meta: {
          name: 'Cobros',
          description: 'Reporte de cobros',
          permissions: ['admin'],
          agentHint: 'Cobros = abonos/pagos recibidos, por sucursal y VENDEDOR que cobro; filtrar por vendedor y fecha; ver cuanto abono cada cliente; PDF.',
          lazy: () => import('./pages/ReporteCobrosPage'),
        },
      },
    ],
  },
]
