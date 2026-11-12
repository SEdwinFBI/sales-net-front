import type { AppRoute } from '@/lib/app-routes'
import { salesRoutes } from '@/features/sales'
import { catalogRoutes } from '@/features/catalog'
import { reportingRoutes } from '@/features/reporting'
import { clientesRoutes } from '@/features/customers'
import { inventarioRoutes } from '@/features/inventario'
import { adminRoutes } from '@/features/admin'
import { cashRoutes } from '@/features/cash'

/** Todas las rutas de las features, sin filtrar por permisos (sidebar y agente filtran después). */
export const allFeatureRoutes: AppRoute[] = [
  ...reportingRoutes,
  ...salesRoutes,
  ...cashRoutes,
  ...clientesRoutes,
  ...catalogRoutes,
  ...inventarioRoutes,
  ...adminRoutes,
]
