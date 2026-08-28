import { useEffect, useState } from 'react'
import { Loader2, Mail, MailPlus, Save } from 'lucide-react'
import { toast } from 'sonner'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { getApiErrorMessage } from '@/lib/api-error'
import { useCreateDestinatario, useDestinatarios, useUpdateDestinatarios } from '../hooks/useDestinatarios'
import type { CrearDestinatarioPayload, DestinatarioNotificacion, PreferenciaNotificacion } from '../types/notificaciones-types'

const PREFERENCIAS: Array<{ key: PreferenciaNotificacion; label: string }> = [
  { key: 'recibir_stock_bajo', label: 'Stock bajo' },
  { key: 'recibir_abonos', label: 'Abonos' },
  { key: 'recibir_clientes_deudas', label: 'Clientes con deudas' },
  { key: 'recibir_ventas_realizadas', label: 'Ventas realizadas' },
]

const EMPTY_FORM: CrearDestinatarioPayload = {
  email: '',
  nombre_persona_email: '',
  recibir_stock_bajo: false,
  recibir_abonos: false,
  recibir_clientes_deudas: false,
  recibir_ventas_realizadas: false,
}

export default function NotificacionesPage() {
  const { data = [], isLoading, isError } = useDestinatarios()
  const { mutateAsync: create, isPending: isCreating } = useCreateDestinatario()
  const { mutateAsync: update, isPending: isUpdating } = useUpdateDestinatarios()
  const [destinatarios, setDestinatarios] = useState<DestinatarioNotificacion[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => setDestinatarios(data), [data])

  const toggle = (id: number, key: PreferenciaNotificacion, checked: boolean) => {
    setDestinatarios((current) => current.map((item) => item.id === id ? { ...item, [key]: checked } : item))
  }

  const save = async () => {
    try {
      await update({
        destinatarios: destinatarios.map((item) => ({
          id: item.id,
          recibir_stock_bajo: item.recibir_stock_bajo,
          recibir_abonos: item.recibir_abonos,
          recibir_clientes_deudas: item.recibir_clientes_deudas,
          recibir_ventas_realizadas: item.recibir_ventas_realizadas,
        })),
      })
      toast.success('Preferencias de notificación guardadas')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar las preferencias'))
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await create(form)
      toast.success('Destinatario agregado')
      setForm(EMPTY_FORM)
      setDialogOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo agregar el destinatario'))
    }
  }

  return (
    <PageTemplateSimple title="Notificaciones" description="Configura quién recibe cada aviso del sistema.">
      <Card className="mx-auto mt-4 max-w-5xl space-y-4 p-3.5 sm:p-5">
        <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-card-foreground">Destinatarios de notificaciones</h1>
              <p className="text-sm text-muted-foreground">Elige los avisos que recibirá cada persona.</p>
            </div>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}><MailPlus />Agregar destinatario</Button>
        </div>

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>}
        {isError && <p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">No se pudieron cargar los destinatarios.</p>}
        {!isLoading && !isError && destinatarios.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aún no hay destinatarios configurados.</p>
        )}

        {destinatarios.map((destinatario) => (
          <Card key={destinatario.id} size="sm" className="border-l-4 border-l-primary bg-card shadow-sm">
            <CardHeader>
              <CardTitle>{destinatario.nombre_persona_email}</CardTitle>
              <CardDescription>{destinatario.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PREFERENCIAS.map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <span>{label}</span>
                  <Switch checked={destinatario[key]} onCheckedChange={(checked) => toggle(destinatario.id, key, checked)} />
                </label>
              ))}
            </CardContent>
          </Card>
        ))}

        {destinatarios.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={save} disabled={isUpdating}>{isUpdating ? <Loader2 className="animate-spin" /> : <Save />}Guardar cambios</Button>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Agregar destinatario</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Nombre</span><Input required value={form.nombre_persona_email} onChange={(e) => setForm({ ...form, nombre_persona_email: e.target.value })} placeholder="Ej. Encargado de bodega" /></label>
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Correo electrónico</span><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nombre@empresa.com" /></label>
            <div className="space-y-2">
              <p className="text-sm font-medium">Avisos que recibirá</p>
              {PREFERENCIAS.map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{label}</span><Switch checked={form[key]} onCheckedChange={(checked) => setForm({ ...form, [key]: checked })} />
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isCreating}>{isCreating && <Loader2 className="animate-spin" />}Agregar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTemplateSimple>
  )
}
