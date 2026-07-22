import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, BarChart3, CalendarDays, Package, RotateCcw,
  ShoppingCart, TrendingDown, TrendingUp, Users, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import { useArticulos } from '@/features/catalog/hooks/useArticulos'
import { useTallas } from '@/features/catalog/hooks/useTallas'
import { useUsuarios } from '@/features/adminUsuarios/hooks/useUsuarios'
import { useVariantes } from '@/features/catalog/hooks/useVariantes'
import { useMediaQuery } from '@/features/core/hooks/useMediaQuery'
import { getDashboardData, type DashboardFilters } from '../services/reportes-service'
import type { DashboardData } from '../types/reportes'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
const Q = (v: number) => `Q${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const P = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
const money = (v: unknown) => `Q${Number(v ?? 0).toFixed(2)}`

const CHART_AXIS = { fontSize: 10, fill: '#94a3b8' }
const CHART_HEIGHT = 230

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

/** Rango por defecto: lo que va del mes (del 1 al día de hoy). */
function getDefaultDateRange() {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  const start = `${end.slice(0, 8)}01`
  return { fecha_desde: start, fecha_hasta: end }
}

// ─── KPI compacto con acento de color ───
function Kpi({ label, value, sub, icon: Icon, accent, trend, trendLabel }: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string // ej: 'blue'
  trend?: number
  /** Mini leyenda del indicador, ej. "vs mes anterior" */
  trendLabel?: string
}) {
  const accents: Record<string, { border: string; chip: string; icon: string }> = {
    blue: { border: 'border-l-blue-500', chip: 'bg-blue-50', icon: 'text-blue-600' },
    green: { border: 'border-l-emerald-500', chip: 'bg-emerald-50', icon: 'text-emerald-600' },
    amber: { border: 'border-l-amber-500', chip: 'bg-amber-50', icon: 'text-amber-600' },
    red: { border: 'border-l-red-500', chip: 'bg-red-50', icon: 'text-red-600' },
    purple: { border: 'border-l-violet-500', chip: 'bg-violet-50', icon: 'text-violet-600' },
    cyan: { border: 'border-l-cyan-500', chip: 'bg-cyan-50', icon: 'text-cyan-600' },
  }
  const a = accents[accent] ?? accents.blue
  return (
    <div className={cn('rounded-lg border border-l-[3px] border-border/60 bg-card px-3 py-2.5 shadow-sm', a.border)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', a.chip)}>
          <Icon className={cn('size-3', a.icon)} />
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {trend >= 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
            {P(trend)}
            {trendLabel && (
              <span className="font-normal text-muted-foreground">{trendLabel}</span>
            )}
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─── Card de gráfico uniforme ───
function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm', className)}>
      <div className="border-b border-border/40 bg-muted/20 px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">{title}</h3>
      </div>
      <div className="min-w-0 overflow-hidden p-2">{children}</div>
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
    id_vendedor: searchParams.get('vendedor') ? Number(searchParams.get('vendedor')) : undefined,
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
    searchParams.get('vendedor') || searchParams.get('articulo') || searchParams.get('talla') ||
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
  const { data: usuarios = [] } = useUsuarios()
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

  const d = data ?? ({} as DashboardData)
  const r = d.resumen ?? ({} as DashboardData['resumen'])
  const cmp = d.comparacion ?? ({} as DashboardData['comparacion'])
  const vhoy = d.ventas_hoy ?? ({} as DashboardData['ventas_hoy'])
  const chartHeight = isMobile ? 198 : CHART_HEIGHT
  const chartAxis = isMobile ? { ...CHART_AXIS, fontSize: 8 } : CHART_AXIS
  const chartMargin = isMobile
    ? { top: 6, right: 4, bottom: 6, left: -16 }
    : { right: 8 }
  const verticalChartMargin = isMobile
    ? { top: 6, right: 4, bottom: 6, left: -20 }
    : { left: 0, right: 8 }
  const xAxisHeight = isMobile ? 28 : undefined
  const axisMoney = (v: unknown) => formatAxisMoney(v, isMobile)
  const pieLabel = (p: { name?: string; percent?: number }) => {
    const percent = `${((p.percent ?? 0) * 100).toFixed(0)}%`
    return isMobile ? percent : `${truncateLabel(p.name, 16)} ${percent}`
  }

  const sinDatos = !isLoading && !(d.top_articulos?.length) && !(d.ventas_por_dia?.length)

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <Skeleton className="h-14 rounded-lg" />
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-lg" />)}
        </div>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-70')}>
      {/* ─── Header + Filtros siempre visibles ─── */}
      <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <div className="mr-auto">
            <h2 className="text-sm font-bold leading-tight">Dashboard</h2>
            <p className="text-[10px] text-muted-foreground">{d.periodo ?? ''}</p>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Desde</label>
            <Input type="date" className="h-8 w-[140px] text-xs"
              value={filters.fecha_desde ?? ''}
              onChange={e => setFilter('fecha_desde', e.target.value)} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Hasta</label>
            <Input type="date" className="h-8 w-[140px] text-xs"
              value={filters.fecha_hasta ?? ''}
              onChange={e => setFilter('fecha_hasta', e.target.value)} />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Vendedor</label>
            <select className="h-8 w-[150px] rounded-md border border-input bg-card px-2 text-xs"
              value={searchParams.get('vendedor') ?? ''}
              onChange={e => setFilter('vendedor', e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.fullName ?? u.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Artículo</label>
            <select className="h-8 w-[170px] rounded-md border border-input bg-card px-2 text-xs"
              value={searchParams.get('articulo') ?? ''}
              onChange={e => setFilter('articulo', e.target.value)}>
              <option value="">Todos</option>
              {articulos.filter(a => a.activo !== false).map(a => (
                <option key={a.id} value={a.id}>{a.titulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Talla</label>
            <select className="h-8 w-[110px] rounded-md border border-input bg-card px-2 text-xs disabled:opacity-50"
              value={searchParams.get('talla') ?? ''}
              onChange={e => setFilter('talla', e.target.value)}
              disabled={!filters.id_articulo}>
              <option value="">Todas</option>
              {tallasDelArticulo.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          {hasCustomFilters && (
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={clearFilters}>
              <RotateCcw className="size-3" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* ─── KPIs compactos ─── */}
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total Neto del Mes" value={Q(r.total_neto ?? 0)} accent="blue" icon={ShoppingCart}
          trend={cmp.ven_mes_anterior} trendLabel="vs mes anterior"
          sub={`Bruto ${Q(r.total_bruto ?? 0)} · Desc ${Q(r.total_descuento ?? 0)}`} />
        <Kpi label="Ventas" value={String(r.cantidad_ventas ?? 0)} accent="green" icon={BarChart3}
          sub={`${r.cantidad_unidades ?? 0} unidades · Prom ${Q(r.promedio_por_venta ?? 0)}`} />
        <Kpi label="Hoy" value={Q(vhoy.total_neto ?? 0)} accent="cyan" icon={CalendarDays}
          trend={vhoy.variacion_ayer} trendLabel="vs ayer"
          sub={`${vhoy.cantidad_ventas ?? 0} ventas hoy`} />
        <Kpi label="Por Cobrar" value={Q(r.total_adeudado ?? 0)} accent="amber" icon={Wallet}
          sub={`${r.total_deudores ?? 0} deudores`} />
        <Kpi label="Stock Bajo" value={String(r.stock_bajo ?? 0)} accent="red" icon={AlertTriangle}
          sub="Tallas con menos de 5 uds" />
        <Kpi label="Negocio" value={`${r.total_clientes ?? 0}`} accent="purple" icon={Users}
          sub={`clientes · ${r.total_articulos ?? 0} artículos · ${r.total_vendedores ?? 0} vendedores`} />
      </div>

      {sinDatos ? (
        <EmptyState icon={Package} title="Sin ventas en este período"
          description="Cambiá las fechas o quitá filtros para ver datos." />
      ) : (
        <>
          {/* ─── Fila 1: Artículos + Tallas + Día de semana ─── */}
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {(d.top_articulos?.length ?? 0) > 0 && (
              <ChartCard title="Top artículos por venta">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={d.top_articulos} layout="vertical" margin={verticalChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                    <XAxis type="number" tick={chartAxis} stroke="#e2e8f0" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <YAxis
                      type="category"
                      dataKey="articulo"
                      tick={chartAxis}
                      stroke="#e2e8f0"
                      width={isMobile ? 72 : 105}
                      tickFormatter={v => truncateLabel(v, isMobile ? 11 : 18)}
                    />
                    <Tooltip formatter={v => [money(v), 'Neto']} />
                    <Bar dataKey="total_neto" radius={[0, 3, 3, 0]} barSize={isMobile ? 10 : 14}>
                      {(d.top_articulos ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.top_tallas?.length ?? 0) > 0 && (
              <ChartCard title="Ventas por talla">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={d.top_tallas} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="talla" tick={chartAxis} stroke="#e2e8f0" height={xAxisHeight} tickMargin={isMobile ? 6 : 3} />
                    <YAxis tick={chartAxis} stroke="#e2e8f0" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip formatter={(v, name) => name === 'Unidades' ? [v, name] : [money(v), name]} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '9px' : '10px' }} />
                    <Bar dataKey="total_neto" name="Neto" fill="#8b5cf6" radius={[3, 3, 0, 0]} barSize={isMobile ? 10 : 18} />
                    <Bar dataKey="unidades" name="Unidades" fill="#c4b5fd" radius={[3, 3, 0, 0]} barSize={isMobile ? 10 : 18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.ventas_por_dia_semana?.length ?? 0) > 0 && (
              <ChartCard title="Ventas por día de la semana">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={d.ventas_por_dia_semana} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis
                      dataKey="dia"
                      tick={{ ...chartAxis, fontSize: isMobile ? 8 : 9 }}
                      stroke="#e2e8f0"
                      height={xAxisHeight}
                      tickMargin={isMobile ? 6 : 3}
                      tickFormatter={v => truncateLabel(v, isMobile ? 3 : 12)}
                    />
                    <YAxis tick={chartAxis} stroke="#e2e8f0" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip formatter={v => [money(v), 'Neto']} />
                    <Bar dataKey="total_neto" radius={[3, 3, 0, 0]} barSize={isMobile ? 14 : 22}>
                      {(d.ventas_por_dia_semana ?? []).map((row, i) => (
                        <Cell key={i} fill={row.total_neto === Math.max(...(d.ventas_por_dia_semana ?? []).map(x => x.total_neto)) ? '#f59e0b' : '#06b6d4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* ─── Fila 2: Vendedores + Pago + Acumulado ─── */}
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {(d.top_vendedores?.length ?? 0) > 0 && (
              <ChartCard title="Vendedores — bruto vs neto">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={d.top_vendedores} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ ...chartAxis, fontSize: isMobile ? 8 : 9 }}
                      stroke="#e2e8f0"
                      height={xAxisHeight}
                      tickMargin={isMobile ? 6 : 3}
                      tickFormatter={v => truncateLabel(v, isMobile ? 6 : 12)}
                    />
                    <YAxis tick={chartAxis} stroke="#e2e8f0" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip formatter={v => [money(v), '']} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '9px' : '10px' }} />
                    <Bar dataKey="total_bruto" name="Bruto" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={isMobile ? 9 : 14} />
                    <Bar dataKey="total_neto" name="Neto" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={isMobile ? 9 : 14} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.formas_pago?.length ?? 0) > 0 && (
              <ChartCard title="Forma de pago">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart margin={isMobile ? { top: 2, right: 4, bottom: 18, left: 4 } : { top: 4, right: 8, bottom: 4, left: 8 }}>
                    <Pie data={d.formas_pago} dataKey="total_neto" nameKey="nombre"
                      cx="50%" cy={isMobile ? '43%' : '50%'} outerRadius={isMobile ? 56 : 80} innerRadius={isMobile ? 34 : 48} paddingAngle={2}
                      label={pieLabel}
                      labelLine={!isMobile}>
                      {(d.formas_pago ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [money(v), '']} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: isMobile ? '9px' : '10px', lineHeight: isMobile ? '12px' : '14px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(d.ventas_acumuladas_mes?.length ?? 0) > 0 && (
              <ChartCard title="Acumulado del mes vs mes anterior">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={d.ventas_acumuladas_mes} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="fecha" tick={{ ...chartAxis, fontSize: 8 }} stroke="#e2e8f0"
                      height={xAxisHeight}
                      tickMargin={isMobile ? 6 : 3}
                      minTickGap={isMobile ? 12 : 5}
                      tickFormatter={v => String(v).slice(8)} />
                    <YAxis tick={chartAxis} stroke="#e2e8f0" tickFormatter={axisMoney} tickCount={isMobile ? 3 : 5} />
                    <Tooltip formatter={v => [money(v), '']} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '9px' : '10px' }} />
                    <Line type="monotone" dataKey="acumulado" name="Este mes" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="acumulado_mes_anterior" name="Mes anterior" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* ─── Fila 3: Stock bajo + Deudores ─── */}
          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title={`Stock bajo (${r.stock_bajo ?? 0} tallas)`}>
              {(d.stock_bajo?.length ?? 0) > 0 ? (
                <div className="max-h-[210px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b text-muted-foreground">
                        <th className="px-2 py-1.5 text-left font-medium">Artículo</th>
                        <th className="px-2 py-1.5 text-left font-medium">Sucursal</th>
                        <th className="px-2 py-1.5 text-center font-medium">Talla</th>
                        <th className="px-2 py-1.5 text-right font-medium">Precio</th>
                        <th className="px-2 py-1.5 text-right font-medium">Stock</th>
                        <th className="px-2 py-1.5 text-center font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.stock_bajo ?? []).map((s, i) => (
                        <tr key={`${s.id_variante}-${s.id_sucursal}`} className={cn('border-b border-border/30', i % 2 === 1 && 'bg-muted/10')}>
                          <td className="px-2 py-1.5">{s.articulo}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">
                            {s.sucursal || '-'}
                          </td>
                          <td className="px-2 py-1.5 text-center text-muted-foreground">{s.talla}</td>
                          <td className="px-2 py-1.5 text-right">{Q(s.precio)}</td>
                          <td className="px-2 py-1.5 text-right font-bold">{s.total_stock}</td>
                          <td className="px-2 py-1.5 text-center">
                            <span className={cn(
                              'inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold',
                              s.total_stock <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            )}>
                              {s.total_stock <= 2 ? 'Crítico' : 'Bajo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-[11px] text-muted-foreground">Sin alertas de stock ✓</p>
              )}
            </ChartCard>

            <ChartCard title="Top deudores">
              {(d.top_deudores?.length ?? 0) > 0 ? (
                <div className="max-h-[210px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b text-muted-foreground">
                        <th className="px-2 py-1.5 text-left font-medium">Cliente</th>
                        <th className="px-2 py-1.5 text-left font-medium">Teléfono</th>
                        <th className="px-2 py-1.5 text-right font-medium">Balance</th>
                        <th className="px-2 py-1.5 text-right font-medium">Últ. compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.top_deudores ?? []).map((c, i) => (
                        <tr key={c.id_cliente} className={cn('border-b border-border/30', i % 2 === 1 && 'bg-muted/10')}>
                          <td className="px-2 py-1.5 font-medium">{c.nombre}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{c.telefono || '—'}</td>
                          <td className="px-2 py-1.5 text-right font-bold text-red-600">{Q(c.balance)}</td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">
                            {c.ultima_compra ? c.ultima_compra.slice(0, 10) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-[11px] text-muted-foreground">Sin deudores ✓</p>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
