import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CashSummary } from '../components/CashSummary'
import { MovementsTable } from '../components/MovementsTable'
import { useCreateMovimientoCaja, useMiCaja } from '../hooks/useCash'
import type { TipoMovimientoCaja } from '../types/cash'
import { getApiErrorMessage } from '@/lib/api-error'

export default function MyCashPage() {
  const { data: caja, isLoading } = useMiCaja()
  const mutation = useCreateMovimientoCaja()
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('ENTRADA')
  const [monto, setMonto] = useState('')
  const [observacion, setObservacion] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutation.mutateAsync({ tipo, monto: Number(monto), observacion })
      toast.success('Movimiento registrado')
      setMonto(''); setObservacion(''); setOpen(false)
    } catch (error) { toast.error(getApiErrorMessage(error, 'No se pudo registrar el movimiento')) }
  }

  return <PageTemplateSimple title="Mi caja" description="Entradas y gastos de efectivo del día.">
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Caja de hoy</h1><p className="text-sm text-muted-foreground">{caja ? `${caja.sucursal.nombre} · ${new Date(`${caja.fecha}T12:00:00`).toLocaleDateString('es-GT')}` : 'Cargando...'}</p></div><Button onClick={() => setOpen(true)} disabled={isLoading}><Plus /> Registrar movimiento</Button></div>
      {caja && <><CashSummary caja={caja} /><Card><CardHeader><CardTitle>Movimientos del día</CardTitle></CardHeader><CardContent><MovementsTable movimientos={caja.movimientos} /></CardContent></Card></>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={submit} className="space-y-4"><DialogHeader><DialogTitle>Registrar movimiento</DialogTitle><DialogDescription>Registra una entrada o un gasto de efectivo en la caja de hoy.</DialogDescription></DialogHeader>
      <div><label className="mb-1 block text-sm">Tipo</label><Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimientoCaja)}><option value="ENTRADA">Entrada de efectivo</option><option value="SALIDA">Gasto / salida</option></Select></div>
      <div><label className="mb-1 block text-sm">Monto</label><Input type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required /></div>
      <div><label className="mb-1 block text-sm">Observación</label><Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Ej. efectivo inicial, almuerzo, pasaje..." required /></div>
      <DialogFooter showCloseButton={false}><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar'}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </PageTemplateSimple>
}
