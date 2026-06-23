import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useCliente } from '../hooks/useCliente'
import { useAbonosHistorial } from '../hooks/useAbonosHistorial'
import { useComprasCliente } from '../hooks/useComprasCliente'
import ClienteInfo from '../components/ClienteInfo'
import MovimientosTable from '../components/MovimientosTable'
import AbonosTable from '../components/AbonosTable'
import ComprasTable from '../components/ComprasTable'
import AbonarDialog from '../components/AbonarDialog'
import CrearVentaEncabezadoDialog from '../components/CrearVentaEncabezadoDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clienteId = Number(id)
  const { data: cliente, isLoading, isError } = useCliente(clienteId)
  const { abonos } = useAbonosHistorial(clienteId)
  const { ventas, resumen } = useComprasCliente(clienteId)
  const [abonarOpen, setAbonarOpen] = useState(false)
  const [ventaDialogOpen, setVentaDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <PageTemplateSimple title="Cargando..." description="">
        <div className="animate-pulse space-y-4 rounded-2xl bg-white p-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
          <div className="h-20 rounded bg-muted" />
        </div>
      </PageTemplateSimple>
    )
  }

  if (isError || !cliente) {
    return (
      <PageTemplateSimple title="Cliente no encontrado" description="">
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          El cliente solicitado no existe o fue eliminado.
        </div>
      </PageTemplateSimple>
    )
  }

  return (
    <PageTemplateSimple title={cliente.nombre_completo} description="Detalle del cliente">
      <div className="space-y-6">
        <Card className="p-3.5 sm:p-5">
          <Breadcrumb
            className="mb-3"
            items={[{ label: 'Clientes', href: '/clientes' }, { label: cliente.nombre_completo }]}
          />

          <Button variant="ghost" onClick={() => navigate('/clientes')} className="w-fit">
            <ArrowLeft />
            Volver a clientes
          </Button>

          <ClienteInfo cliente={cliente} />

          <Tabs defaultValue="movimientos">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="movimientos">Movimientos generales</TabsTrigger>
                <TabsTrigger value="abonos">Abonos</TabsTrigger>
                <TabsTrigger value="compras">Compras</TabsTrigger>
              </TabsList>
              <Button onClick={() => setVentaDialogOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus />
                Registrar venta
              </Button>
              <Button onClick={() => setAbonarOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus />
                Registrar abono
              </Button>
            </div>

            <TabsContent value="movimientos" className="mt-4">
              <MovimientosTable ventas={ventas} abonos={abonos} resumen={resumen} />
            </TabsContent>

            <TabsContent value="abonos" className="mt-4">
              <AbonosTable abonos={abonos} />
            </TabsContent>

            <TabsContent value="compras" className="mt-4">
              <ComprasTable ventas={ventas} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <CrearVentaEncabezadoDialog
        open={ventaDialogOpen}
        idCliente={clienteId}
        clienteNombre={cliente.nombre_completo}
        onClose={() => setVentaDialogOpen(false)}
      />

      <AbonarDialog
        open={abonarOpen}
        ventas={ventas}
        idCliente={clienteId}
        onClose={() => setAbonarOpen(false)}
      />
    </PageTemplateSimple>
  )
}
