import { useState } from 'react'
import { formatCurrency } from '../utils/venta-total'
import { useParams, useNavigate } from 'react-router'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useCliente } from '../hooks/useCliente'
import { useAbonosHistorial } from '../hooks/useAbonosHistorial'
import { useComprasCliente } from '../hooks/useComprasCliente'
import { useMovimientosCliente } from '../hooks/useMovimientosCliente'
import ClienteInfo from '../components/ClienteInfo'
import MovimientosTable from '../components/MovimientosTable'
import AbonosTable from '../components/AbonosTable'
import ComprasTable from '../components/ComprasTable'
import PreciosClienteTable from '../components/PreciosClienteTable'
import AbonarDialog from '../components/AbonarDialog'
import AjusteClienteDialog from '../components/AjusteClienteDialog'
import CrearVentaEncabezadoDialog from '../components/CrearVentaEncabezadoDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Tag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { buildClienteDetailTools, type ClienteTab } from '../agent/cliente-detail-tools'
import type { AbonoFormValues, AjusteFormValues, VentaClienteFormValues } from '../agent/cliente-detail-forms'

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clienteId = Number(id)
  const { data: cliente, isLoading, isError } = useCliente(clienteId)
  const sinCredito = cliente?.permitir_credito === false
  const { abonos } = useAbonosHistorial(sinCredito ? 0 : clienteId)
  const { ventas, resumen } = useComprasCliente(clienteId)
  const { movimientos } = useMovimientosCliente(sinCredito ? 0 : clienteId)
  const [abonarOpen, setAbonarOpen] = useState(false)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [ventaDialogOpen, setVentaDialogOpen] = useState(false)
  // Valores con los que el agente abre cada formulario (los botones normales los abren vacíos).
  const [abonoInitial, setAbonoInitial] = useState<Partial<AbonoFormValues> | undefined>(undefined)
  const [ajusteInitial, setAjusteInitial] = useState<Partial<AjusteFormValues> | undefined>(undefined)
  const [ventaInitial, setVentaInitial] = useState<Partial<VentaClienteFormValues> | undefined>(undefined)
  // Pestaña elegida y con qué estado de crédito se eligió: al cambiar el crédito vuelve a la pestaña inicial
  // (antes lo hacía `key` al remontar las pestañas).
  const [tabSelection, setTabSelection] = useState<{ creditKey: string; value: string } | null>(null)

  const creditKey = String(cliente?.permitir_credito)
  const activeTab = tabSelection?.creditKey === creditKey ? tabSelection.value : sinCredito ? 'precios' : 'movimientos'

  // Tools del agente: leen la ficha, cambian de pestaña y abren los formularios (el usuario guarda).
  useAgentTools(
    'cliente-detail-page',
    cliente
      ? buildClienteDetailTools({
          getCliente: () => cliente,
          getTab: () => activeTab as ClienteTab,
          setTab: (tab) => setTabSelection({ creditKey, value: tab }),
          getResumen: () => resumen,
          getVentas: () => ventas,
          isDialogOpen: () => abonarOpen || ajusteOpen || ventaDialogOpen,
          openAbono: (valores) => { setAbonoInitial(valores); setAbonarOpen(true) },
          openAjuste: (valores) => { setAjusteInitial(valores); setAjusteOpen(true) },
          openVenta: (valores) => { setVentaInitial(valores); setVentaDialogOpen(true) },
        })
      : null,
  )

  if (isLoading) {
    return (
      <PageTemplateSimple title="Cargando..." description="">
        <Card className="animate-pulse space-y-4 p-3.5 sm:p-5">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
          <div className="h-20 rounded bg-muted" />
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
    <PageTemplateSimple title={cliente.nombre_completo} description="Detalle del cliente">
      <div className="space-y-6">
        <Card className="p-3.5 sm:p-5">
          <Breadcrumb
            className="mb-3"
            items={[{ label: 'Clientes', href: '/clientes' }, { label: cliente.nombre_completo }]}
          />

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => navigate('/clientes/listado')} className="w-fit">
              <ArrowLeft />
              Volver a clientes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/clientes/listado/${clienteId}/precios`)}
              className="gap-1.5"
            >
              <Tag className="size-4 text-primary" />
              Ver precios
            </Button>
          </div>

          <ClienteInfo cliente={cliente} />

          {resumen && !sinCredito && (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Total ventas</p>
                <p className="text-xl font-bold">{resumen.total_ventas}</p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Total general</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(resumen.total_general)}</p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Pagado</p>
                <p className="text-xl font-bold text-successful">{formatCurrency(resumen.total_pagado)}</p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Abonado</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(resumen.total_abonado)}</p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">Balance (deuda)</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(resumen.balance)}</p>
              </div>
            </div>
          )}

          {sinCredito && <p className="text-sm text-muted-foreground">Este cliente compra únicamente al contado.</p>}
          <Tabs key={creditKey} value={activeTab} onValueChange={(value) => setTabSelection({ creditKey, value: String(value) })}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full sm:w-fit">
                {!sinCredito && <TabsTrigger value="movimientos">Movimientos generales</TabsTrigger>}
                {!sinCredito && <TabsTrigger value="abonos">Abonos</TabsTrigger>}
                <TabsTrigger value="compras">Compras</TabsTrigger>
                <TabsTrigger value="precios">Precios del cliente</TabsTrigger>
              </TabsList>
              {!sinCredito && <>
              <Button onClick={() => { setVentaInitial(undefined); setVentaDialogOpen(true) }} size="sm" className="w-full sm:w-auto">
                <Plus />
                Registrar venta
              </Button>
              <Button onClick={() => { setAbonoInitial(undefined); setAbonarOpen(true) }} size="sm" className="w-full sm:w-auto">
                <Plus />
                Registrar abono
              </Button>
              <Button
                onClick={() => { setAjusteInitial(undefined); setAjusteOpen(true) }}
                size="sm"
                className="w-full bg-red-500 text-white hover:bg-red-600 sm:w-auto"
              >
                <Plus />
                Registrar ajuste
              </Button>
              </>}
            </div>

            <TabsContent value="movimientos" className="mt-4">
              <MovimientosTable movimientos={movimientos} />
            </TabsContent>

            <TabsContent value="abonos" className="mt-4">
              <AbonosTable abonos={abonos} />
            </TabsContent>

            <TabsContent value="compras" className="mt-4">
              <ComprasTable ventas={ventas} />
            </TabsContent>

            <TabsContent value="precios" className="mt-4">
              <PreciosClienteTable customerId={clienteId} customerName={cliente.nombre_completo} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {!sinCredito && <>
      <CrearVentaEncabezadoDialog
        open={ventaDialogOpen}
        idCliente={clienteId}
        clienteNombre={cliente.nombre_completo}
        initialValues={ventaInitial}
        onClose={() => { setVentaDialogOpen(false); setVentaInitial(undefined) }}
      />

      <AbonarDialog
        open={abonarOpen}
        ventas={ventas}
        idCliente={clienteId}
        initialValues={abonoInitial}
        onClose={() => { setAbonarOpen(false); setAbonoInitial(undefined) }}
      />

      <AjusteClienteDialog
        open={ajusteOpen}
        idCliente={clienteId}
        initialValues={ajusteInitial}
        onClose={() => { setAjusteOpen(false); setAjusteInitial(undefined) }}
      />
      </>}
    </PageTemplateSimple>
  )
}
