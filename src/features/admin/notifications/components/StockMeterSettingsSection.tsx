import { ChartNoAxesColumn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { getApiErrorMessage } from '@/lib/api-error'
import { usePosSettings, useUpdatePosSettings } from '@/features/sales/hooks/usePosSettings'

export default function StockMeterSettingsSection() {
  const { data, isLoading, isError, refetch } = usePosSettings()
  const mutation = useUpdatePosSettings()

  async function update(enabled: boolean) {
    try {
      await mutation.mutateAsync(enabled)
      toast.success(enabled ? 'Barras de stock habilitadas para vendedores' : 'Barras de stock ocultas para vendedores')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la configuración'))
    }
  }

  return (
    <Card className="gap-3 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ChartNoAxesColumn aria-hidden="true" className="size-5" /></span>
          <div>
            <h2 id="stock-meter-title" className="font-semibold">Barras de stock para vendedores</h2>
            <p id="stock-meter-description" className="mt-1 text-sm text-muted-foreground">Mostrar en el punto de venta.</p>
          </div>
        </div>
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 sm:justify-end">
          {isLoading || mutation.isPending ? <Loader2 aria-label="Guardando o cargando configuración" className="size-4 animate-spin" /> :
            <span className="text-sm font-medium">{isError ? 'No disponible' : data?.mostrar_barras_stock_vendedores ? 'Habilitadas' : 'Ocultas'}</span>}
          <Switch checked={data?.mostrar_barras_stock_vendedores ?? false} disabled={isLoading || isError || mutation.isPending || !data}
            aria-labelledby="stock-meter-title" aria-describedby="stock-meter-description" onCheckedChange={(checked) => void update(checked)} />
        </div>
      </div>
      {isError && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
        No se pudo cargar esta opción.<Button size="sm" variant="outline" onClick={() => void refetch()}>Reintentar</Button>
      </div>}
    </Card>
  )
}
