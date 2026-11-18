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
          agentHint: 'Dashboard (resumen general): KPIs, mas vendidos, stock bajo y deudores; filtrar por fechas, sucursal, articulo y talla.',
          lazy: () => import('./pages/DashboardPage'),
        },
      },
      {
        path: 'ventas',
        meta: {
          name: 'Ventas',
          description: 'Reporte de ventas',
          permissions: ['admin'],
          agentHint: 'Reporte de ventas (totales y estadisticas): filtrar por fechas, articulo, talla y sucursal; ver por variante o sucursal; PDF.',
          lazy: () => import('./pages/ReporteVentasPage'),
        },
      },
      {
        path: 'deudores',
        meta: {
          name: 'Deudores',
          description: 'Reporte de deudores',
          permissions: ['admin'],
          agentHint: 'Deudores (clientes que deben, saldos pendientes): filtrar por nombre o lugar, leer y descargar el PDF.',
          lazy: () => import('./pages/ReporteDeudoresPage'),
        },
      },
      {
        path: 'cobros',
        meta: {
          name: 'Cobros',
          description: 'Reporte de cobros',
          permissions: ['admin'],
          agentHint: 'Cobros (abonos recibidos): filtrar por usuario y fecha, leer por sucursal y usuario y descargar el PDF.',
          lazy: () => import('./pages/ReporteCobrosPage'),
        },
      },
    ],
  },
]
