import { useState } from 'react'
import { Eye } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/helpers/money'
import { getDefaultDateRange } from '@/lib/dates'
import { CashSummary } from '../components/CashSummary'
import { MovementsTable } from '../components/MovementsTable'
import { useCaja, useCajas } from '../hooks/useCash'

export default function CashAuditsPage() {
  const [filters, setFilters] = useState(getDefaultDateRange())
  const [selected, setSelected] = useState<number | null>(null)
  const { data: cajas = [], isLoading } = useCajas(filters)
  const { data: detalle } = useCaja(selected)
  return <PageTemplateSimple title="Arqueos de caja" description="Resumen diario de efectivo por vendedor y sucursal."><div className="space-y-4">
    <div><h1 className="text-2xl font-semibold">Arqueos de caja</h1><p className="text-sm text-muted-foreground">Consulta el resumen y abre cada caja para ver sus movimientos.</p></div>
    <Card><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 sm:max-w-lg"><div><label className="mb-1 block text-xs text-muted-foreground">Fecha desde</label><Input type="date" value={filters.fecha_desde} onChange={(e) => setFilters((f) => ({ ...f, fecha_desde: e.target.value }))} /></div><div><label className="mb-1 block text-xs text-muted-foreground">Fecha hasta</label><Input type="date" value={filters.fecha_hasta} onChange={(e) => setFilters((f) => ({ ...f, fecha_hasta: e.target.value }))} /></div></div>
      <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Vendedor</TableHead><TableHead>Sucursal</TableHead><TableHead className="text-right">Entradas</TableHead><TableHead className="text-right">Gastos</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Esperado</TableHead><TableHead /></TableRow></TableHeader>
      <TableBody>{cajas.map((c) => <TableRow key={c.id}><TableCell>{new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-GT')}</TableCell><TableCell>{c.usuario.nombre}</TableCell><TableCell>{c.sucursal.nombre}</TableCell><TableCell className="text-right">{formatCurrency(Number(c.entradas))}</TableCell><TableCell className="text-right">{formatCurrency(Number(c.salidas))}</TableCell><TableCell className="text-right">{formatCurrency(Number(c.ventas_efectivo))}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(Number(c.efectivo_esperado))}</TableCell><TableCell><Button variant="ghost" size="icon-sm" onClick={() => setSelected(c.id)} aria-label="Ver detalle"><Eye /></Button></TableCell></TableRow>)}</TableBody></Table>
      {!isLoading && !cajas.length && <p className="py-8 text-center text-sm text-muted-foreground">No hay cajas en este período.</p>}
    </CardContent></Card>
    <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Detalle de caja</DialogTitle><DialogDescription>{detalle ? `${detalle.usuario.nombre} · ${detalle.sucursal.nombre} · ${new Date(`${detalle.fecha}T12:00:00`).toLocaleDateString('es-GT')}` : 'Cargando...'}</DialogDescription></DialogHeader>{detalle && <div className="max-h-[70vh] space-y-4 overflow-y-auto"><CashSummary caja={detalle} /><MovementsTable movimientos={detalle.movimientos} /></div>}</DialogContent></Dialog>
  </div></PageTemplateSimple>
}
