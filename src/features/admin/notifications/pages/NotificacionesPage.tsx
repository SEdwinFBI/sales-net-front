import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Loader2,
  Mail,
  MailPlus,
  Receipt,
  RotateCcw,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import Paginator from '@/components/shared/table/Paginator'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  useCreateDestinatario,
  useDeleteDestinatario,
  useDestinatarios,
  useUpdateDestinatarios,
} from '../hooks/useDestinatarios'
import type {
  CrearDestinatarioPayload,
  DestinatarioNotificacion,
  PreferenciaNotificacion,
} from '../types/notificaciones-types'

interface PreferenceConfig {
  key: PreferenciaNotificacion
  title: string
  description: string
  icon: typeof Mail
  activeColor: string
  iconBg: string
  iconColor: string
}

const PREFERENCIAS_CONFIG: PreferenceConfig[] = [
  {
    key: 'recibir_stock_bajo',
    title: 'Stock bajo',
    description: 'Avisos cuando el inventario llegue al mínimo',
    icon: AlertTriangle,
    activeColor: 'border-amber-500/40 dark:border-amber-500/30 bg-amber-500/5',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'recibir_abonos',
    title: 'Abonos registrados',
    description: 'Confirmación de pagos y abonos de clientes',
    icon: Receipt,
    activeColor: 'border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/5',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'recibir_clientes_deudas',
    title: 'Deudas de clientes',
    description: 'Alertas de saldos pendientes y mora',
    icon: Users,
    activeColor: 'border-rose-500/40 dark:border-rose-500/30 bg-rose-500/5',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    key: 'recibir_ventas_realizadas',
    title: 'Ventas realizadas',
    description: 'Resumen en tiempo real de cada venta nueva',
    icon: ShoppingBag,
    activeColor: 'border-sky-500/40 dark:border-sky-500/30 bg-sky-500/5',
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
]

const EMPTY_FORM: CrearDestinatarioPayload = {
  email: '',
  nombre_persona_email: '',
  recibir_stock_bajo: true,
  recibir_abonos: true,
  recibir_clientes_deudas: false,
  recibir_ventas_realizadas: false,
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'NT'
}

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-violet-600 to-purple-600',
  'from-amber-600 to-orange-600',
  'from-rose-600 to-pink-600',
]

function getAvatarGradient(id: number): string {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length]
}

export default function NotificacionesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  const { data, isLoading, isError } = useDestinatarios({
    search: debouncedSearch || undefined,
    page,
    page_size: pageSize,
  })

  const { mutateAsync: create, isPending: isCreating } = useCreateDestinatario()
  const { mutateAsync: update, isPending: isUpdating } = useUpdateDestinatarios()
  const { mutateAsync: remove, isPending: isDeleting } = useDeleteDestinatario()

  const [destinatarios, setDestinatarios] = useState<DestinatarioNotificacion[]>([])
  const [initialSnapshot, setInitialSnapshot] = useState<string>('[]')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [destinatarioAEliminar, setDestinatarioAEliminar] = useState<DestinatarioNotificacion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const results = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.ceil(count / pageSize)

  useEffect(() => {
    if (isError) {
      toast.error('No se pudieron cargar los destinatarios')
    }
  }, [isError])

  useEffect(() => {
    setDestinatarios(results)
    setInitialSnapshot(JSON.stringify(results))
  }, [results])

  const hasChanges = useMemo(() => {
    return JSON.stringify(destinatarios) !== initialSnapshot
  }, [destinatarios, initialSnapshot])

  const toggle = (id: number, key: PreferenciaNotificacion, checked: boolean) => {
    setDestinatarios((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: checked } : item))
    )
  }

  const resetChanges = () => {
    setDestinatarios(JSON.parse(initialSnapshot))
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
      setInitialSnapshot(JSON.stringify(destinatarios))
      toast.success('Preferencias de notificación guardadas con éxito')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar las preferencias'))
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await create(form)
      toast.success('Destinatario registrado correctamente')
      setForm(EMPTY_FORM)
      setDialogOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el destinatario'))
    }
  }

  const removeDestinatario = async () => {
    if (!destinatarioAEliminar) return
    try {
      await remove(destinatarioAEliminar.id)
      toast.success('Destinatario eliminado del sistema')
      setDestinatarioAEliminar(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar el destinatario'))
    }
  }

  return (
    <PageTemplateSimple
      title="Notificaciones"
      description="Configura quién recibe los avisos automáticos por correo."
    >
      <div className="space-y-3.5">
        {/* Barra Superior con Métricas, Búsqueda y Acciones */}
        <Card className="border-border/70 bg-card p-3 shadow-2xs sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Título y Conteo */}
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BellRing className="size-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-card-foreground">Destinatarios</h1>
                  <Badge variant="secondary" className="px-1.5 py-0 text-xs font-medium">
                    {count}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Avisos automáticos de stock, cobros y ventas
                </p>
              </div>
            </div>

            {/* Buscador + Acciones */}
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:max-w-2xl">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar nombre o correo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasChanges && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetChanges}
                      disabled={isUpdating}
                      className="h-8 px-2.5 text-xs"
                    >
                      <RotateCcw className="size-3.5" />
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      onClick={save}
                      disabled={isUpdating}
                      className="h-8 gap-1 px-3 text-xs"
                    >
                      {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      Guardar
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="h-8 gap-1 px-3 text-xs"
                >
                  <MailPlus className="size-3.5" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-card/40 py-10 text-center">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Cargando destinatarios...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && destinatarios.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
            <Mail className="size-7 text-muted-foreground/60" />
            <p className="text-xs font-semibold text-foreground">
              {search ? 'Sin coincidencias para la búsqueda' : 'No hay destinatarios registrados'}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setDialogOpen(true)} className="mt-1 h-7 gap-1 text-xs">
                <MailPlus className="size-3.5" />
                Registrar primero
              </Button>
            )}
          </div>
        )}

        {/* Lista de Tarjetas Compactas */}
        <div className="space-y-2">
          {destinatarios.map((destinatario) => {
            const activeCount = PREFERENCIAS_CONFIG.filter((p) => destinatario[p.key]).length
            const initials = getInitials(destinatario.nombre_persona_email)
            const avatarGradient = getAvatarGradient(destinatario.id)

            return (
              <Card
                key={destinatario.id}
                className="overflow-hidden border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40 sm:p-3.5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Info Destinatario */}
                  <div className="flex items-center justify-between gap-3 lg:min-w-[240px] lg:max-w-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${avatarGradient} text-xs font-bold text-white shadow-2xs`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-xs font-semibold text-card-foreground">
                            {destinatario.nombre_persona_email}
                          </h2>
                          <span className="text-[10px] text-muted-foreground">
                            ({activeCount}/4)
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {destinatario.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting}
                      onClick={() => setDestinatarioAEliminar(destinatario)}
                      className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:hidden"
                      aria-label={`Eliminar a ${destinatario.nombre_persona_email}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {/* 4 Canales de Notificación en Formato Compacto */}
                  <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4 lg:max-w-2xl">
                    {PREFERENCIAS_CONFIG.map(({ key, title, description, icon: Icon, activeColor, iconBg }) => {
                      const isActive = Boolean(destinatario[key])

                      return (
                        <label
                          key={key}
                          title={description}
                          className={`flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 transition-all ${
                            isActive
                              ? `${activeColor} border-opacity-100 shadow-2xs`
                              : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Icon
                              className={`size-3.5 shrink-0 ${
                                isActive ? iconBg.split(' ')[1] : 'text-muted-foreground'
                              }`}
                            />
                            <span
                              className={`truncate text-xs ${
                                isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {title}
                            </span>
                          </div>

                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => toggle(destinatario.id, key, checked)}
                            className="scale-75 shrink-0"
                          />
                        </label>
                      )
                    })}
                  </div>

                  {/* Botón Eliminar en Desktop */}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isDeleting}
                    onClick={() => setDestinatarioAEliminar(destinatario)}
                    className="hidden size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:flex"
                    aria-label={`Eliminar a ${destinatario.nombre_persona_email}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Sticky Save Bar cuando hay cambios pendientes */}
        {hasChanges && (
          <div className="sticky bottom-3 z-10 flex items-center justify-between rounded-xl border border-primary/40 bg-card/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-primary animate-ping" />
              <p className="text-xs font-medium text-card-foreground">
                Tienes cambios sin guardar.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={resetChanges} disabled={isUpdating} className="h-7 px-2 text-xs">
                Descartar
              </Button>
              <Button size="sm" onClick={save} disabled={isUpdating} className="h-7 gap-1 px-3 text-xs">
                {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Paginación Compacta */}
        {count > 0 && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, count)} de {count} destinatarios
            </p>
            <div className="flex flex-col items-center gap-2.5 sm:flex-row">
              <label
                className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground"
                htmlFor="notif-page-size"
              >
                Por página:
                <Select
                  id="notif-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="h-7 w-16 text-xs"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Select>
              </label>
              <Paginator page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
            </div>
          </div>
        )}
      </div>

      {/* Modal: Confirmación para Eliminar */}
      <Dialog
        open={Boolean(destinatarioAEliminar)}
        onOpenChange={(open) => !open && !isDeleting && setDestinatarioAEliminar(null)}
      >
        <DialogContent showCloseButton={!isDeleting} className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle>Eliminar destinatario</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-semibold text-foreground">{destinatarioAEliminar?.nombre_persona_email}</span> (
              {destinatarioAEliminar?.email})? Esta persona dejará de recibir cualquier notificación por correo de forma inmediata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" disabled={isDeleting} onClick={() => setDestinatarioAEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={removeDestinatario} className="gap-1.5">
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar destinatario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Nuevo Destinatario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailPlus className="size-5" />
            </div>
            <DialogTitle>Nuevo destinatario de avisos</DialogTitle>
            <DialogDescription className="text-xs">
              Ingresa los datos de contacto y selecciona qué alertas se le enviarán por correo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 pt-1">
            <div className="space-y-3">
              <label className="block space-y-1.5 text-xs font-medium text-foreground">
                <span>Nombre completo o cargo</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    value={form.nombre_persona_email}
                    onChange={(e) => setForm({ ...form, nombre_persona_email: e.target.value })}
                    placeholder="Ej. Carlos Mendoza (Bodega Central)"
                    className="pl-9"
                  />
                </div>
              </label>

              <label className="block space-y-1.5 text-xs font-medium text-foreground">
                <span>Correo electrónico de recepción</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="carlos.mendoza@empresa.com"
                    className="pl-9"
                  />
                </div>
              </label>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avisos que recibirá
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PREFERENCIAS_CONFIG.map(({ key, title, description, icon: Icon, activeColor, iconBg }) => {
                  const isChecked = Boolean(form[key])

                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-start justify-between gap-2.5 rounded-xl border p-2.5 transition-all ${
                        isChecked
                          ? `${activeColor} shadow-2xs`
                          : 'border-border/60 bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${
                            isChecked ? iconBg : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold leading-tight text-foreground">{title}</p>
                          <p className="line-clamp-1 text-[10px] text-muted-foreground">{description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={(checked) => setForm({ ...form, [key]: checked })}
                        className="scale-90"
                      />
                    </label>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-1.5">
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Guardar destinatario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTemplateSimple>
  )
}


