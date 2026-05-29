import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useCliente } from '../hooks/useCliente'
import { useAbonosHistorial } from '../hooks/useAbonosHistorial'
import { useComprasCliente } from '../hooks/useComprasCliente'
import ClienteInfo from '../components/ClienteInfo'
import AbonosTable from '../components/AbonosTable'
import ComprasTable from '../components/ComprasTable'
import AbonarDialog from '../components/AbonarDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clienteId = Number(id)
  const { data: cliente, isLoading, isError } = useCliente(clienteId)
  const { abonos } = useAbonosHistorial(clienteId)
  const { ventas, resumen } = useComprasCliente(clienteId)
  const [abonarOpen, setAbonarOpen] = useState(false)

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
        <Button variant="ghost" onClick={() => navigate('/clientes')} className="w-fit">
          <ArrowLeft />
          Volver a clientes
        </Button>

        <ClienteInfo cliente={cliente} />

        <Tabs defaultValue="abonos">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="abonos">Abonos</TabsTrigger>
              <TabsTrigger value="compras">Compras</TabsTrigger>
            </TabsList>
            <Button onClick={() => setAbonarOpen(true)} size="sm">
              <Plus />
              Registrar abono
            </Button>
          </div>

          <TabsContent value="abonos" className="mt-4">
            <AbonosTable abonos={abonos} />
          </TabsContent>

          <TabsContent value="compras" className="mt-4">
            <ComprasTable ventas={ventas} resumen={resumen} />
          </TabsContent>
        </Tabs>
      </div>

      <AbonarDialog
        open={abonarOpen}
        ventas={ventas}
        onClose={() => setAbonarOpen(false)}
      />
    </PageTemplateSimple>
  )
}
