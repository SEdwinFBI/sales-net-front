import { useMemo, useState } from 'react'
import { ArrowLeft, Eye, FileDown, Loader2, RotateCcw, Store, UserRound, Users } from 'lucide-react'
import { toast } from 'sonner'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSucursalDetalle } from '@/features/adminSucursales/hooks/useSucursalDetalle'
import { useSucursales } from '@/features/adminSucursales/hooks/useSucursales'
import { formatCurrency } from '@/helpers/money'
import { formatDisplayDate, getDefaultDateRange, getTodayRange } from '@/lib/dates'

import { CashSummary } from '../components/CashSummary'
import { MovementsTable } from '../components/MovementsTable'
import { useCaja, useCajas } from '../hooks/useCash'
import type { Caja } from '../types/cash'
import { downloadCashReport } from '../services/cash-service'
import { getApiErrorMessage } from '@/lib/api-error'

type Totals = Pick<Caja, 'entradas' | 'salidas' | 'ventas_efectivo' | 'efectivo_esperado'>

function sumCajas(cajas: Caja[]): Totals {
  return cajas.reduce<Totals>((total, caja) => ({
    entradas: String(Number(total.entradas) + Number(caja.entradas)),
    salidas: String(Number(total.salidas) + Number(caja.salidas)),
    ventas_efectivo: String(Number(total.ventas_efectivo) + Number(caja.ventas_efectivo)),
    efectivo_esperado: String(Number(total.efectivo_esperado) + Number(caja.efectivo_esperado)),
  }), { entradas: '0', salidas: '0', ventas_efectivo: '0', efectivo_esperado: '0' })
}

function formatDate(fecha: string) {
  return formatDisplayDate(fecha)
}

export default function CashAuditsPage() {
  const [filters, setFilters] = useState(getDefaultDateRange())
  const [branchId, setBranchId] = useState<number | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [cashId, setCashId] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const { data: sucursales, isLoading: loadingBranches } = useSucursales()
  const { data: branch, isLoading: loadingBranch } = useSucursalDetalle(branchId)
  const { data: cajas = [], isLoading: loadingCajas } = useCajas(filters)
  const { data: todayCajas = [], isLoading: loadingToday } = useCajas(getTodayRange())
  const { data: detalle } = useCaja(cashId)

  const branchCajas = useMemo(
    () => branchId === null ? [] : cajas.filter((caja) => caja.sucursal.id === branchId),
    [cajas, branchId],
  )
  const branchTodayCajas = useMemo(
    () => branchId === null ? [] : todayCajas.filter((caja) => caja.sucursal.id === branchId),
    [todayCajas, branchId],
  )
  const userCajas = useMemo(
    () => userId === null ? [] : branchCajas.filter((caja) => caja.usuario.id === userId),
    [branchCajas, userId],
  )
  const userTodayCajas = useMemo(
    () => userId === null ? [] : branchTodayCajas.filter((caja) => caja.usuario.id === userId),
    [branchTodayCajas, userId],
  )
  const selectedUser = branch?.usuarios.find((usuario) => usuario.id === userId)

  const selectBranch = (id: number) => {
    setBranchId(id)
    setUserId(null)
  }

  const selectUser = (id: number) => {
    setUserId(id)
  }

  const back = () => {
    if (userId !== null) setUserId(null)
    else setBranchId(null)
  }

  const downloadReport = async () => {
    setDownloading(true)
    try {
      await downloadCashReport({
        ...filters,
        id_sucursal: branchId ?? undefined,
        id_usuario: userId ?? undefined,
      })
      toast.success('Reporte descargado correctamente')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo descargar el reporte'))
    } finally {
      setDownloading(false)
    }
  }

  const resetReportFilters = () => {
    setFilters(getDefaultDateRange())
  }

  return (
    <PageTemplateSimple title="Arqueos de caja" description="Arqueos consolidados por sucursal e individuales por vendedor.">
      <Card className="mx-auto p-3.5 sm:p-5">
        <div className="space-y-5 sm:space-y-6">
          {branchId !== null && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={back}>
                <ArrowLeft />
                Volver a {userId !== null ? 'la sucursal' : 'sucursales'}
              </Button>
              {selectedUser && (
                <p className="text-sm font-semibold">
                  {selectedUser.full_name || selectedUser.username}
                  <span className="ml-2 font-normal text-muted-foreground">· {branch?.nombre}</span>
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {userId !== null ? 'Reporte individual' : branchId !== null ? 'Reporte de sucursal' : 'Reporte general'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {selectedUser?.full_name || branch?.nombre || 'Todas las sucursales'}
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto_auto]">
              <Field className="gap-1"><FieldLabel htmlFor="cash-from" className="text-xs">Fecha desde</FieldLabel><Input id="cash-from" type="date" value={filters.fecha_desde} onChange={(event) => setFilters((value) => ({ ...value, fecha_desde: event.target.value }))} /></Field>
              <Field className="gap-1"><FieldLabel htmlFor="cash-to" className="text-xs">Fecha hasta</FieldLabel><Input id="cash-to" type="date" value={filters.fecha_hasta} onChange={(event) => setFilters((value) => ({ ...value, fecha_hasta: event.target.value }))} /></Field>
              <Button variant="outline" onClick={resetReportFilters} disabled={downloading}><RotateCcw /> Reiniciar</Button>
              <Button onClick={downloadReport} disabled={downloading}>{downloading ? <Loader2 className="animate-spin" /> : <FileDown />}{downloading ? 'Generando…' : 'Descargar'}</Button>
              </div>
            </div>
          </div>

          {branchId === null ? (
            <BranchList
              branches={sucursales}
              cajas={todayCajas}
              loading={loadingBranches || loadingToday}
              onSelect={selectBranch}
            />
          ) : userId === null ? (
            <BranchAudit
              branchName={branch?.nombre}
              users={branch?.usuarios ?? []}
              cajas={branchTodayCajas}
              loading={loadingBranch || loadingToday}
              onSelectUser={selectUser}
            />
          ) : (
            <UserAudit cajas={userCajas} todayCajas={userTodayCajas} loading={loadingCajas || loadingToday} onDetail={setCashId} />
          )}
        </div>
      </Card>

      <Dialog open={cashId !== null} onOpenChange={(open) => !open && setCashId(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de caja</DialogTitle>
            <DialogDescription>{detalle ? `${detalle.usuario.nombre} · ${detalle.sucursal.nombre} · ${formatDate(detalle.fecha)}` : 'Cargando…'}</DialogDescription>
          </DialogHeader>
          {detalle && <div className="max-h-[70vh] space-y-4 overflow-y-auto"><CashSummary caja={detalle} /><MovementsTable movimientos={detalle.movimientos} /></div>}
        </DialogContent>
      </Dialog>
    </PageTemplateSimple>
  )
}

function BranchList({ branches, cajas, loading, onSelect }: {
  branches: Array<{ id: number; nombre: string; direccion: string; activo: boolean; usuarios_count?: number }>
  cajas: Caja[]
  loading: boolean
  onSelect: (id: number) => void
}) {
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-xl" />)}</div>
  if (!branches.length) return <EmptyState icon={Store} title="No hay sucursales disponibles" />
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {branches.map((branch) => {
      const branchCajas = cajas.filter((caja) => caja.sucursal.id === branch.id)
      const totals = sumCajas(branchCajas)
      return <Card key={branch.id} className="border-l-4 border-l-primary p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2.5"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Store className="size-4.5" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{branch.nombre}</p><p className="truncate text-xs text-muted-foreground">{branch.direccion || 'Sin dirección registrada'}</p></div></div><Badge variant={branch.activo ? 'default' : 'secondary'}>{branch.activo ? 'Activa' : 'Inactiva'}</Badge></div>
        <div className="grid grid-cols-2 gap-2 text-xs"><div><p className="text-muted-foreground">Saldo esperado hoy</p><p className="font-semibold">{formatCurrency(Number(totals.efectivo_esperado))}</p></div><div><p className="text-muted-foreground">Usuarios</p><p className="font-semibold">{branch.usuarios_count ?? 0}</p></div></div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => onSelect(branch.id)}><Users /> Ver arqueos</Button>
      </Card>
    })}
  </div>
}

function BranchAudit({ branchName, users, cajas, loading, onSelectUser }: {
  branchName?: string
  users: Array<{ id: number; username: string; full_name: string }>
  cajas: Caja[]
  loading: boolean
  onSelectUser: (id: number) => void
}) {
  if (loading) return <><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-52 rounded-xl" /></>
  return <div className="space-y-5">
    <div><h2 className="mb-3 font-heading text-base font-semibold">Hoy · {branchName}</h2><CashSummary caja={sumCajas(cajas)} expectedLabel="Saldo esperado hoy" /></div>
    <div className="space-y-3"><h2 className="font-heading text-base font-semibold">Usuarios</h2>
      {!users.length ? <EmptyState icon={Users} title="No hay usuarios asignados" /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{users.map((user) => {
        const userCajas = cajas.filter((caja) => caja.usuario.id === user.id)
        const totals = sumCajas(userCajas)
        return <button key={user.id} type="button" onClick={() => onSelectUser(user.id)} className="rounded-xl border border-border/70 bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" /></div><div><p className="text-sm font-semibold">{user.full_name || user.username}</p><p className="text-xs text-muted-foreground">{userCajas.length ? 'Caja de hoy' : 'Sin caja hoy'}</p></div></div><div className="mt-3 border-t border-border/70 pt-3"><p className="text-xs text-muted-foreground">Saldo esperado hoy</p><p className="font-semibold">{formatCurrency(Number(totals.efectivo_esperado))}</p></div></button>
      })}</div>}
    </div>
  </div>
}

function UserAudit({ cajas, todayCajas, loading, onDetail }: { cajas: Caja[]; todayCajas: Caja[]; loading: boolean; onDetail: (id: number) => void }) {
  if (loading) return <Skeleton className="h-64 rounded-xl" />
  return <div className="space-y-5"><CashSummary caja={sumCajas(todayCajas)} expectedLabel="Saldo esperado hoy" />
    {!cajas.length ? <EmptyState icon={UserRound} title="Sin cajas en este período" /> : <div className="space-y-3"><h2 className="font-heading text-base font-semibold">Cajas por día</h2><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead className="text-right">Entradas</TableHead><TableHead className="text-right">Gastos</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead /></TableRow></TableHeader><TableBody>{cajas.map((caja) => <TableRow key={caja.id}><TableCell>{formatDate(caja.fecha)}</TableCell><TableCell className="text-right">{formatCurrency(Number(caja.entradas))}</TableCell><TableCell className="text-right">{formatCurrency(Number(caja.salidas))}</TableCell><TableCell className="text-right">{formatCurrency(Number(caja.ventas_efectivo))}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(Number(caja.efectivo_esperado))}</TableCell><TableCell><Button variant="ghost" size="icon-sm" onClick={() => onDetail(caja.id)} aria-label="Ver detalle"><Eye /></Button></TableCell></TableRow>)}</TableBody></Table></div>}
  </div>
}
