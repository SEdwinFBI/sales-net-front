import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, BarChart3, CalendarDays, CheckCircle2, Package, RotateCcw,
  ShoppingCart, TrendingDown, TrendingUp, Users, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { formatCurrency, formatNumber } from '@/helpers/money'
import { useArticulos } from '@/features/catalog/hooks/useArticulos'
import { useTallas } from '@/features/catalog/hooks/useTallas'
import { useSucursales } from '@/features/admin'
import { useVariantes } from '@/features/catalog/hooks/useVariantes'
import { useMediaQuery } from '@/features/core/hooks/useMediaQuery'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { getDefaultDateRange } from '@/lib/dates'
import { desgloseOrigen } from '../utils/origen'
import { useLiveContext } from '@/features/agent/registry/useLiveContext'
import { buildDashboardTools } from '../agent/reportes-tools'
import { getDashboardData, type DashboardFilters } from '../services/reportes-service'
import type { DashboardData } from '../types/reportes'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

const Q = (v: number) => formatCurrency(v)
const P = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
const money = (v: unknown) => formatCurrency(Number(v ?? 0))

const CHART_AXIS = { fontSize: 10, fill: 'var(--muted-foreground)' }
const CHART_HEIGHT = 240

const TOOLTIP_CONTENT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--popover)',
  borderColor: 'var(--border)',
  borderRadius: '12px',
  boxShadow: 'var(--app-shadow-elevated)',
  color: 'var(--popover-foreground)',
  fontSize: '12px',
  padding: '8px 12px',
}

const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: 'var(--popover-foreground)',
  fontWeight: 600,
  marginBottom: '4px',
}

const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  color: 'var(--muted-foreground)',
  padding: '1px 0',
}

const truncateLabel = (value: unknown, maxLength: number) => {
  const text = String(value ?? '')
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text
}

const formatAxisMoney = (value: unknown, compact = false) => {
  const n = Number(value ?? 0)
  if (!compact) return `Q${n}`
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `Q${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `Q${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`
  return `Q${n}`
}

// ─── KPI ejecutivo con acento de color tematizable ───
function Kpi({ label, value, sub, detail, icon: Icon, accent, trend, trendLabel }: {
  label: string
  value: string
  sub?: string
  /** Segunda línea, más discreta (lo que solo existe en el POS, por ejemplo). */
  detail?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  trend?: number
  /** Mini leyenda del indicador, ej. "vs mes anterior" */
  trendLabel?: string
}) {
  const accents: Record<string, { bar: string; chip: string; icon: string }> = {
    blue: { bar: 'bg-primary', chip: 'bg-primary/12 dark:bg-primary/20', icon: 'text-primary' },
    green: { bar: 'bg-emerald-500', chip: 'bg-emerald-500/12 dark:bg-emerald-500/20', icon: 'text-emerald-600 dark:text-emerald-400' },
    amber: { bar: 'bg-amber-500', chip: 'bg-amber-500/12 dark:bg-amber-500/20', icon: 'text-amber-600 dark:text-amber-400' },
    red: { bar: 'bg-rose-500', chip: 'bg-rose-500/12 dark:bg-rose-500/20', icon: 'text-rose-600 dark:text-rose-400' },
    purple: { bar: 'bg-violet-500', chip: 'bg-violet-500/12 dark:bg-violet-500/20', icon: 'text-violet-600 dark:text-violet-400' },
    cyan: { bar: 'bg-sky-500', chip: 'bg-sky-500/12 dark:bg-sky-500/20', icon: 'text-sky-600 dark:text-sky-400' },
  }
  const a = accents[accent] ?? accents.blue
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-card transition-[box-shadow,border-color] duration-150 hover:border-border hover:shadow-card-hover">
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', a.bar)} />
      <div className="flex items-center justify-between gap-2 pl-1">
        <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
          {label}
        </p>
        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', a.chip)}>
          <Icon className={cn('size-3.5', a.icon)} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-1">
        <p className="font-heading text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {trend !== undefined && trend !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
              trend >= 0
                ? 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
            )}
          >
            {trend >= 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
            {P(trend)}
          </span>
        )}
      </div>
      {(sub || (trend !== undefined && trend !== 0 && trendLabel)) && (
        <p className="mt-1.5 truncate pl-1 text-[11px] text-muted-foreground">
          {trend !== undefined && trend !== 0 && trendLabel ? `${trendLabel} · ` : ''}
          {sub}
        </p>
      )}
      {detail && <p className="mt-0.5 truncate pl-1 text-[10.5px] text-muted-foreground/80">{detail}</p>}
    </div>
  )
}

// ─── Card de gráfico uniforme ───
function ChartCard({ title, badge, children, className }: {
  title: string
  badge?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <h3 className="truncate font-heading text-xs font-semibold uppercase tracking-[0.06em] text-foreground/85">
          {title}
        </h3>
        {badge && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {badge}
          </span>
        )}
      </div>
      <div className="min-w-0 overflow-hidden p-3">{children}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const def = useMemo(() => getDefaultDateRange(), [])
  const isMobile = useMediaQuery('(max-width: 640px)')

  // ─── Filtros desde searchParams (SSR: el backend filtra todo) ───
  const filters = useMemo<DashboardFilters>(() => ({
    fecha_desde: searchParams.get('fecha_desde') || def.fecha_desde,
    fecha_hasta: searchParams.get('fecha_hasta') || def.fecha_hasta,
    id_sucursal: searchParams.get('sucursal') ? Number(searchParams.get('sucursal')) : undefined,
    id_articulo: searchParams.get('articulo') ? Number(searchParams.get('articulo')) : undefined,
    id_talla: searchParams.get('talla') ? Number(searchParams.get('talla')) : undefined,
  }), [searchParams, def])

  // Auto-aplica: cada cambio escribe el searchParam y dispara el refetch
  const setFilter = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      if (key === 'articulo') prev.delete('talla') // talla depende del artículo
      return prev
    }, { replace: true })
  }, [setSearchParams])

  const clearFilters = () => setSearchParams({}, { replace: true })

  const hasCustomFilters =
    searchParams.get('sucursal') || searchParams.get('articulo') || searchParams.get('talla') ||
    (searchParams.get('fecha_desde') && searchParams.get('fecha_desde') !== def.fecha_desde) ||
    (searchParams.get('fecha_hasta') && searchParams.get('fecha_hasta') !== def.fecha_hasta)

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: queryKeys.reporting.dashboard(filters as Record<string, unknown>),
    queryFn: () => getDashboardData(filters),
    staleTime: 1000 * 60 * 3,
    placeholderData: prev => prev, // mantiene el layout al cambiar filtros
  })

  useEffect(() => {
    if (isError) toast.error(getApiErrorMessage(error, 'Error al cargar el dashboard'))
  }, [isError, error])

  // ─── Catálogos para los selects ───
  const { data: sucursales = [] } = useSucursales()
  const { data: articulos = [] } = useArticulos()
  const { data: variantes = [] } = useVariantes()
  const { data: tallas = [] } = useTallas()

  // Tallas disponibles para el artículo elegido
  const tallasDelArticulo = useMemo(() => {
    if (!filters.id_articulo) return []
    const nombrePorId = new Map(tallas.map(t => [t.id, t.nombre]))
    const ids = new Set(
      variantes.filter(v => v.id_articulo === filters.id_articulo && v.activo).map(v => v.id_talla)
    )
    return [...ids]
      .map(id => ({ id, nombre: nombrePorId.get(id) ?? `#${id}` }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))
  }, [variantes, tallas, filters.id_articulo])

  // Tools del agente: escriben los mismos searchParams que los selectores (la talla se borra al cambiar de artículo).
  useAgentTools(
    'dashboard-page',
    buildDashboardTools(useLiveContext({
      getFilters: () => ({
        fecha_desde: filters.fecha_desde ?? def.fecha_desde,
        fecha_hasta: filters.fecha_hasta ?? def.fecha_hasta,
        sucursal_id: filters.id_sucursal,
        articulo_id: filters.id_articulo,
        talla_id: filters.id_talla,
      }),
      // Una sola escritura: setSearchParams no encola actualizaciones seguidas (cada una parte del render anterior).
      apply: (changes) => {
        setSearchParams((prev) => {
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === '') prev.delete(key)
            else prev.set(key, String(value))
            if (key === 'articulo') prev.delete('talla') // talla depende del artículo
          }
          return prev
        }, { replace: true })
      },
      clear: clearFilters,
      getOptions: () => ({
        sucursales: sucursales.map((s) => ({ id: s.id, nombre: s.nombre })),
        articulos: articulos.filter((a) => a.activo !== false).map((a) => ({ id: a.id, titulo: a.titulo })),
        tallasDe: (articuloId) => {
          const nombrePorId = new Map(tallas.map((t) => [t.id, t.nombre]))
          const ids = new Set(variantes.filter((v) => v.id_articulo === articuloId && v.activo).map((v) => v.id_talla))
          return [...ids].map((id) => ({ id, nombre: nombrePorId.get(id) ?? `#${id}` }))
        },
      }),
      getData: () => data,
      isLoading: () => isLoading || isFetching,
    })),
  )

  const d = data ?? ({} as DashboardData)
  const r = d.resumen ?? ({} as DashboardData['resumen'])
  const cmp = d.comparacion ?? ({} as DashboardData['comparacion'])
  const vhoy = d.ventas_hoy ?? ({} as DashboardData['ventas_hoy'])
  const chartHeight = isMobile ? 204 : CHART_HEIGHT
  const chartAxis = isMobile ? { ...CHART_AXIS, fontSize: 8 } : CHART_AXIS
  const chartMargin = isMobile
    ? { top: 6, right: 4, bottom: 6, left: -16 }
    : { top: 6, right: 10, bottom: 0, left: 0 }
  const verticalChartMargin = isMobile
    ? { top: 6, right: 6, bottom: 6, left: -18 }
    : { top: 6, left: 4, right: 12, bottom: 0 }
  const xAxisHeight = isMobile ? 28 : undefined
  const axisMoney = (v: unknown) => formatAxisMoney(v, true)
  const formasPago = useMemo(() => d.formas_pago_global ?? d.formas_pago ?? [], [d.formas_pago_global, d.formas_pago])
  const formaPagoTotal = useMemo(
    () => formasPago.reduce((acc, item) => acc + Number(item.total_neto ?? 0), 0),
    [formasPago],
  )
  const pieData = useMemo(
    () =>
      formasPago.map((item) => {
        const pct = formaPagoTotal > 0 ? Math.round((Number(item.total_neto ?? 0) / formaPagoTotal) * 100) : 0
        return { ...item, displayName: `${item.nombre} (${pct}%)` }
      }),
    [formasPago, formaPagoTotal],
  )
  const row1Count =
    Number((d.top_articulos?.length ?? 0) > 0) +
    Number((d.top_tallas?.length ?? 0) > 0) +
    Number((d.ventas_por_dia_semana?.length ?? 0) > 0)
  const row2Count =
    Number((d.top_sucursales?.length ?? 0) > 0) +
    Number(formasPago.length > 0) +
    Number((d.ventas_acumuladas_mes?.length ?? 0) > 0)

  const sinDatos = !isLoading && !(d.top_articulos?.length) && !(d.ventas_por_dia?.length) && !r.por_origen?.cliente?.total_neto

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[76px] rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4 transition-opacity duration-200', isFetching && 'opacity-70')}>
      {/* ─── Header + Filtros siempre visibles ─── */}
      <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold leading-tight text-foreground">
              Resumen ejecutivo
            </h2>
            {d.periodo ? (
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                <CalendarDays className="size-3.5 text-primary/75" aria-hidden="true" />
                {d.periodo}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Indicadores comerciales del período</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-end">
            <div className="min-w-0">
              <label htmlFor="dash-desde" className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Desde
              </label>
              <Input
                id="dash-desde"
                type="date"
                className="h-8.5 w-full text-xs sm:w-[142px]"
                value={filters.fecha_desde ?? ''}
                onChange={e => setFilter('fecha_desde', e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="dash-hasta" className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Hasta
              </label>
              <Input
                id="dash-hasta"
                type="date"
                className="h-8.5 w-full text-xs sm:w-[142px]"
                value={filters.fecha_hasta ?? ''}
                onChange={e => setFilter('fecha_hasta', e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="dash-sucursal" className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Sucursal
              </label>
              <Select
                id="dash-sucursal"
                className="h-8.5 w-full text-xs sm:w-[152px]"
                value={searchParams.get('sucursal') ?? ''}
                onChange={e => setFilter('sucursal', e.target.value)}
              >
                <option value="">Todas</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-0">
              <label htmlFor="dash-articulo" className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Artículo
              </label>
              <Select
                id="dash-articulo"
                className="h-8.5 w-full text-xs sm:w-[168px]"
                value={searchParams.get('articulo') ?? ''}
                onChange={e => setFilter('articulo', e.target.value)}
              >
                <option value="">Todos</option>
                {articulos.filter(a => a.activo !== false).map(a => (
                  <option key={a.id} value={a.id}>{a.titulo}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-0">
              <label htmlFor="dash-talla" className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Talla
              </label>
              <Select
                id="dash-talla"
                className="h-8.5 w-full text-xs disabled:opacity-50 sm:w-[108px]"
                value={searchParams.get('talla') ?? ''}
                onChange={e => setFilter('talla', e.target.value)}
                disabled={!filters.id_articulo}
              >
                <option value="">Todas</option>
                {tallasDelArticulo.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </Select>
            </div>
            {hasCustomFilters && (
              <Button size="sm" variant="outline" className="h-8.5 self-end text-xs" onClick={clearFilters}>
                <RotateCcw className="size-3.5" /> Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── KPIs ejecutivos ─── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Valor principal: global (POS + ventas registradas en el cliente); debajo, el desglose. */}
        <Kpi label="Total neto" value={Q(r.por_origen?.global.total_neto ?? r.total_neto ?? 0)} accent="blue" icon={ShoppingCart}
          trend={cmp.por_origen?.global.ven_mes_anterior ?? cmp.ven_mes_anterior} trendLabel="vs mes anterior"
          sub={desgloseOrigen(r.por_origen, 'total_neto', Q) ?? `Bruto ${Q(r.total_bruto ?? 0)} · Desc ${Q(r.total_descuento ?? 0)}`}
          detail={r.por_origen ? `POS bruto ${Q(r.total_bruto ?? 0)} · desc ${Q(r.total_descuento ?? 0)}` : undefined} />
        <Kpi label="Ventas" value={formatNumber(r.por_origen?.global.cantidad_ventas ?? r.cantidad_ventas ?? 0)} accent="green" icon={BarChart3}
          sub={desgloseOrigen(r.por_origen, 'cantidad_ventas', formatNumber) ?? `${formatNumber(r.cantidad_unidades ?? 0)} uds · Prom ${Q(r.promedio_por_venta ?? 0)}`}
          detail={r.por_origen ? `${formatNumber(r.cantidad_unidades ?? 0)} uds POS · Prom POS ${Q(r.promedio_por_venta ?? 0)}` : undefined} />
        <Kpi label="Hoy" value={Q(vhoy.por_origen?.global.total_neto ?? vhoy.total_neto ?? 0)} accent="cyan" icon={CalendarDays}
          trend={vhoy.por_origen?.global.variacion_ayer ?? vhoy.variacion_ayer} trendLabel="vs ayer"
          sub={desgloseOrigen(vhoy.por_origen, 'total_neto', Q) ?? `${formatNumber(vhoy.cantidad_ventas ?? 0)} ventas hoy`}
          detail={vhoy.por_origen ? `${formatNumber(vhoy.por_origen.global.cantidad_ventas ?? 0)} ventas hoy` : undefined} />
        <Kpi label="Por cobrar" value={Q(r.total_adeudado ?? 0)} accent="amber" icon={Wallet}
          sub={`${formatNumber(r.total_deudores ?? 0)} deudores`} />
        <Kpi label="Stock bajo" value={formatNumber(r.stock_bajo ?? 0)} accent="red" icon={AlertTriangle}
          sub="Tallas con menos de 5 uds" />
        <Kpi label="Negocio" value={formatNumber(r.total_clientes ?? 0)} accent="purple" icon={Users}
          sub={`clientes · ${formatNumber(r.total_articulos ?? 0)} arts · ${formatNumber(r.total_sucursales ?? 0)} suc`} />
      </div>
      {r.por_origen?.nota && <p className="-mt-1 px-1 text-xs text-muted-foreground">{r.por_origen.nota}</p>}

      {sinDatos ? (
        <EmptyState icon={Package} title="Sin ventas en este período"
          description="Cambia el rango de fechas o limpia los filtros activos para consultar otros resultados." />
      ) : (
        <>
          {/* ─── Fila 1: Artículos + Tallas + Día de semana ─── */}
          <div className={cn('grid gap-4', row1Count === 1 ? 'grid-cols-1' : row1Count === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-3')}>
            {(d.top_articulos?.length ?? 0) > 0 && (
              <ChartCard title="Top artículos por venta · solo POS" badge={`Top ${d.top_articulos?.length ?? 0}`}>
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <BarChart data={d.top_articulos} layout="vertical" margin={verticalChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={chartAxis} stroke="var(--border)" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <YAxis
                      type="category"
                      dataKey="articulo"
                      tick={chartAxis}
                      stroke="var(--border)"
                      width={isMobile ? 72 : 108}
                      tickFormatter={v => truncateLabel(v, isMobile ? 11 : 18)}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                      formatter={v => [money(v), 'Neto']}
                    />
                    <Bar dataKey="total_neto" radius={[0, 6, 6, 0]} barSize={isMobile ? 10 : 14}>
                      {(d.top_articulos ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.top_tallas?.length ?? 0) > 0 && (
              <ChartCard title="Ventas por talla · solo POS">
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <BarChart data={d.top_tallas} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="talla" tick={chartAxis} stroke="var(--border)" height={xAxisHeight} tickMargin={isMobile ? 6 : 4} />
                    <YAxis tick={chartAxis} stroke="var(--border)" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                      formatter={(v, name) => name === 'Unidades' ? [v, name] : [money(v), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--muted-foreground)' }} />
                    <Bar dataKey="total_neto" name="Neto" fill="#8b5cf6" radius={[5, 5, 0, 0]} barSize={isMobile ? 10 : 18} />
                    <Bar dataKey="unidades" name="Unidades" fill="#c4b5fd" radius={[5, 5, 0, 0]} barSize={isMobile ? 10 : 18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.ventas_por_dia_semana?.length ?? 0) > 0 && (
              <ChartCard title="Ventas por día de la semana">
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <BarChart data={d.ventas_por_dia_semana} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="dia"
                      tick={{ ...chartAxis, fontSize: isMobile ? 9 : 11 }}
                      stroke="var(--border)"
                      height={xAxisHeight}
                      tickMargin={isMobile ? 6 : 4}
                      tickFormatter={v => String(v ?? '').slice(0, 3)}
                    />
                    <YAxis tick={chartAxis} stroke="var(--border)" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                      formatter={v => [money(v), 'Neto']}
                    />
                    <Bar dataKey="total_neto" radius={[6, 6, 0, 0]} barSize={isMobile ? 14 : 24}>
                      {(d.ventas_por_dia_semana ?? []).map((row, i) => (
                        <Cell
                          key={i}
                          fill={
                            row.total_neto === Math.max(...(d.ventas_por_dia_semana ?? []).map(x => x.total_neto))
                              ? '#f59e0b'
                              : '#06b6d4'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* ─── Fila 2: Sucursales + Pago + Acumulado ─── */}
          <div className={cn('grid gap-4', row2Count === 1 ? 'grid-cols-1' : row2Count === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-3')}>
            {(d.top_sucursales?.length ?? 0) > 0 && (
              <ChartCard title="Sucursales — POS bruto vs neto, y cliente">
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <BarChart data={d.top_sucursales} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ ...chartAxis, fontSize: isMobile ? 8 : 10 }}
                      stroke="var(--border)"
                      height={xAxisHeight}
                      tickMargin={isMobile ? 6 : 4}
                      tickFormatter={v => truncateLabel(v, isMobile ? 8 : 18)}
                    />
                    <YAxis tick={chartAxis} stroke="var(--border)" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                      formatter={v => [money(v), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '11px' }} />
                    <Bar dataKey="total_bruto" name="Bruto POS" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={isMobile ? 9 : 14} />
                    <Bar dataKey="total_neto" name="Neto POS" fill="#22c55e" radius={[5, 5, 0, 0]} barSize={isMobile ? 9 : 14} />
                    {d.top_sucursales?.some((t) => Number(t.total_cliente ?? 0) > 0) && (
                      <Bar dataKey="total_cliente" name="Cliente" fill="#8b5cf6" radius={[5, 5, 0, 0]} barSize={isMobile ? 9 : 14} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {formasPago.length > 0 && (
              <ChartCard title="Forma de pago" badge={Q(formaPagoTotal)}>
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                    <Pie
                      data={pieData}
                      dataKey="total_neto"
                      nameKey="displayName"
                      cx="50%"
                      cy="45%"
                      outerRadius={isMobile ? 60 : 78}
                      innerRadius={isMobile ? 38 : 50}
                      paddingAngle={pieData.length > 1 ? 3 : 0}
                      stroke="var(--card)"
                      strokeWidth={2}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      formatter={v => [money(v), '']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: isMobile ? '10.5px' : '11.5px', lineHeight: '16px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.ventas_acumuladas_mes?.length ?? 0) > 0 && (
              <ChartCard title="Acumulado del mes vs mes anterior">
                <ResponsiveContainer width="100%" height={chartHeight} debounce={200}>
                  <LineChart data={d.ventas_acumuladas_mes} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ ...chartAxis, fontSize: 9 }}
                      stroke="var(--border)"
                      height={xAxisHeight}
                      tickMargin={isMobile ? 6 : 4}
                      minTickGap={isMobile ? 12 : 5}
                      tickFormatter={v => String(v).slice(8)}
                    />
                    <YAxis tick={chartAxis} stroke="var(--border)" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      labelStyle={TOOLTIP_LABEL_STYLE}
                      itemStyle={TOOLTIP_ITEM_STYLE}
                      formatter={v => [money(v), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="acumulado"
                      name="Este mes"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="acumulado_mes_anterior"
                      name="Mes anterior"
                      stroke="var(--muted-foreground)"
                      strokeOpacity={0.55}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 3.5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* ─── Fila 3: Stock bajo + Deudores ─── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Stock bajo" badge={`${formatNumber(r.stock_bajo ?? 0)} tallas`}>
              {(d.stock_bajo?.length ?? 0) > 0 ? (
                <div className="max-h-[240px] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full border-separate border-spacing-0 text-xs">
                    <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs">
                      <tr className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        <th className="border-b border-border/70 px-3 py-2 text-left font-semibold">Artículo</th>
                        <th className="border-b border-border/70 px-2.5 py-2 text-left font-semibold">Sucursal</th>
                        <th className="border-b border-border/70 px-2 py-2 text-center font-semibold">Talla</th>
                        <th className="border-b border-border/70 px-2.5 py-2 text-right font-semibold">Precio</th>
                        <th className="border-b border-border/70 px-2.5 py-2 text-right font-semibold">Stock</th>
                        <th className="border-b border-border/70 px-3 py-2 text-center font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.stock_bajo ?? []).map((s, i) => (
                        <tr
                          key={`${s.id_variante}-${s.id_sucursal}`}
                          className={cn(
                            'transition-colors hover:bg-primary/[0.04]',
                            i % 2 === 1 && 'bg-muted/20',
                          )}
                        >
                          <td className="border-b border-border/40 px-3 py-2 font-medium text-foreground">{s.articulo}</td>
                          <td className="border-b border-border/40 px-2.5 py-2 text-muted-foreground">
                            {s.sucursal || '—'}
                          </td>
                          <td className="border-b border-border/40 px-2 py-2 text-center font-medium text-muted-foreground">
                            {s.talla}
                          </td>
                          <td className="border-b border-border/40 px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                            {Q(s.precio)}
                          </td>
                          <td className="border-b border-border/40 px-2.5 py-2 text-right font-bold tabular-nums text-foreground">
                            {formatNumber(s.total_stock)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                s.total_stock <= 2
                                  ? 'bg-rose-500/14 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                                  : 'bg-amber-500/14 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
                              )}
                            >
                              {s.total_stock <= 2 ? 'Crítico' : 'Bajo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-500/80" aria-hidden="true" />
                  <p className="text-xs font-medium">Sin alertas de stock bajo</p>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Top deudores" badge={`${d.top_deudores?.length ?? 0} clientes`}>
              {(d.top_deudores?.length ?? 0) > 0 ? (
                <div className="max-h-[300px] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full border-separate border-spacing-0 text-xs">
                    <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs">
                      <tr className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        <th className="border-b border-border/70 px-3 py-2 text-left font-semibold">Cliente</th>
                        <th className="border-b border-border/70 px-2.5 py-2 text-left font-semibold">Teléfono</th>
                        <th className="border-b border-border/70 px-2.5 py-2 text-right font-semibold">Balance</th>
                        <th className="border-b border-border/70 px-3 py-2 text-right font-semibold">Últ. compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.top_deudores ?? []).map((c, i) => (
                        <tr
                          key={c.id_cliente}
                          className={cn(
                            'transition-colors hover:bg-primary/[0.04]',
                            i % 2 === 1 && 'bg-muted/20',
                          )}
                        >
                          <td className="border-b border-border/40 px-3 py-2 font-medium text-foreground">{c.nombre}</td>
                          <td className="border-b border-border/40 px-2.5 py-2 tabular-nums text-muted-foreground">
                            {c.telefono || '—'}
                          </td>
                          <td className="border-b border-border/40 px-2.5 py-2 text-right font-bold tabular-nums text-destructive">
                            {Q(c.balance)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {c.ultima_compra ? c.ultima_compra.slice(0, 10) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-500/80" aria-hidden="true" />
                  <p className="text-xs font-medium">Sin clientes con saldo pendiente</p>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
