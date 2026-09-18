import { useParams, useNavigate } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useCliente } from '../hooks/useCliente'
import PreciosClienteTable from '../components/PreciosClienteTable'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ArrowLeft, Tag } from 'lucide-react'
import { formatCurrency } from '@/helpers/money'

export default function ClientePreciosPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clienteId = Number(id)
  const { data: cliente, isLoading, isError } = useCliente(clienteId)

  if (isLoading) {
    return (
      <PageTemplateSimple title="Cargando..." description="">
        <Card className="animate-pulse space-y-4 p-4 sm:p-6">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
          <div className="h-32 rounded bg-muted" />
        </Card>
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
    <PageTemplateSimple
      title={`Artículos y Precios: ${cliente.nombre_completo}`}
      description="Consulta y administración de precios pactados para este cliente"
    >
      <div className="space-y-5">
        <Card className="p-3.5 sm:p-5">
          <Breadcrumb
            className="mb-3"
            items={[
              { label: 'Clientes', href: '/clientes/listado' },
              { label: cliente.nombre_completo, href: `/clientes/listado/${clienteId}` },
              { label: 'Artículos y precios' },
            ]}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/clientes/listado/${clienteId}`)}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="size-4" />
                Volver a detalle
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Teléfono: <strong className="text-foreground">{cliente.telefono}</strong></span>
              <span>·</span>
              <span>Saldo: <strong className="text-foreground">{formatCurrency(cliente.balance)}</strong></span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="size-4 text-primary" />
              <span>Catálogo de artículos con precio especial</span>
            </div>

            <PreciosClienteTable
              customerId={clienteId}
              customerName={cliente.nombre_completo}
            />
          </div>
        </Card>
      </div>
    </PageTemplateSimple>
  )
}
