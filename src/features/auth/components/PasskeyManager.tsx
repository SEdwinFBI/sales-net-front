import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, Eye, EyeOff, Fingerprint, Info, KeyRound, Loader2, LockKeyhole, MonitorSmartphone, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { deletePasskey, listPasskeys, registerPasskey, supportsPasskeys } from '../services/passkey-service'
import type { Passkey } from '../services/passkey-service'
import PasskeyErrorAlert from './PasskeyErrorAlert'

export default function PasskeyManager({ userId }: { userId: number }) {
  const passwordRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [nombre, setNombre] = useState('')
  const [target, setTarget] = useState<Passkey | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState('')
  const passkeys = useQuery({ queryKey: ['passkeys', userId], queryFn: listPasskeys, retry: false })
  const supported = supportsPasskeys()

  const closeDialog = () => {
    if (busy) return
    if (passwordRef.current) passwordRef.current.value = ''
    setOpen(false)
    setShowPassword(false)
    setNombre('')
    setError(null)
    setTarget(null)
  }

  const openDialog = (passkey: Passkey | null = null) => {
    setTarget(passkey)
    setNombre('')
    setShowPassword(false)
    setError(null)
    setMessage('')
    setOpen(true)
  }

  return (
    <div className="grid min-w-0 gap-4">
      {message && <p role="status" className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />{message}</p>}
      {!supported && <p role="status" className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">Este navegador no permite configurar el acceso con dispositivo aquí. Usa un navegador compatible y una conexión segura.</p>}
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold">Tus accesos guardados</h2>
              {!passkeys.isError && passkeys.data && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold" aria-label={`${passkeys.data.length} accesos registrados`}>{passkeys.data.length}</span>}
            </div>
            <p className="text-sm text-muted-foreground">Agrega una nueva o revoca las que ya no uses.</p>
          </div>
          {passkeys.data?.length !== 0 && <Button className="w-full sm:w-auto" disabled={!supported || busy} onClick={() => openDialog()}><Plus aria-hidden="true" />Agregar acceso</Button>}
        </div>
        <div className="p-4 sm:p-5">
          {passkeys.isPending && <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-4 animate-spin" />Cargando accesos…</p>}
          {passkeys.isError && <div className="space-y-3"><PasskeyErrorAlert error={passkeys.error} /><Button variant="outline" disabled={passkeys.isFetching || busy} onClick={() => void passkeys.refetch()}>Volver a cargar</Button></div>}
          {!passkeys.isError && passkeys.data?.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-6 text-center sm:py-10">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Fingerprint aria-hidden="true" className="size-8" /></span>
              <div className="max-w-sm space-y-2"><h3 className="font-heading text-lg font-semibold">Agrega tu primer acceso</h3><p className="text-sm leading-relaxed text-muted-foreground">Después podrás elegir «Ingresar con mi dispositivo» en la pantalla de inicio de sesión.</p></div>
              <Button disabled={!supported || busy} onClick={() => openDialog()}><Plus aria-hidden="true" />Agregar acceso</Button>
              <p className="text-xs text-muted-foreground">Necesitarás la contraseña actual de tu cuenta.</p>
            </div>
          )}
          {!passkeys.isError && !!passkeys.data?.length && <ul className="divide-y divide-border">{passkeys.data.map((passkey) => (
            <li key={passkey.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound aria-hidden="true" className="size-5" /></span>
                <div className="min-w-0"><p className="break-words text-sm font-semibold">{passkey.nombre || `Acceso ${passkey.id}`}</p><p className="text-xs text-muted-foreground">Disponible para ingresar a tu cuenta</p></div>
              </div>
              <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busy} aria-label={`Eliminar acceso ${passkey.nombre || `acceso ${passkey.id}`}`} onClick={() => openDialog(passkey)}><Trash2 aria-hidden="true" />Eliminar acceso</Button>
            </li>
          ))}</ul>}
        </div>
      </Card>
      <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed">Si no puedes usar tu dispositivo, ingresa con tu contraseña.</p>
      </div>
      <details className="group/access-info overflow-hidden rounded-2xl border border-primary/15 bg-card text-sm shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 bg-primary/5 p-4 transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none sm:p-5 [&::-webkit-details-marker]:hidden">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 flex-1 font-heading font-semibold text-foreground">Sobre tus accesos</span>
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform group-open/access-info:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="grid gap-3 border-t border-primary/10 p-4 sm:p-5">
          {[
            {
              icon: MonitorSmartphone,
              title: 'Sincronización',
              description: 'Un mismo acceso puede funcionar en varios dispositivos si se sincroniza entre ellos.',
            },
            {
              icon: ShieldCheck,
              title: 'Equipos compartidos',
              description: 'Guarda el acceso solo en tu perfil personal. Quien pueda desbloquearlo podrá entrar a tu cuenta.',
            },
            {
              icon: Trash2,
              title: 'Al eliminarlo',
              description: 'Dejará de funcionar, pero no cerrará las sesiones abiertas. Si sigue en tu administrador de contraseñas, elimínalo también allí.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 space-y-1.5">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </details>
      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog() }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>{target ? 'Eliminar acceso' : 'Agregar acceso'}</DialogTitle>
            <DialogDescription>{target ? 'Confirma tu contraseña para eliminar este acceso.' : 'Completa estos datos. Después, tu dispositivo te pedirá huella, rostro o PIN para guardar el acceso.'}</DialogDescription>
          </DialogHeader>
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault()
          if (busy || !passwordRef.current?.value) return
          const password = passwordRef.current.value
          passwordRef.current.value = ''
          setShowPassword(false)
          setBusy(true)
          setError(null)
          setMessage('')
          try {
            if (target) await deletePasskey(target.id, password)
            else {
              await registerPasskey(password, nombre)
              toast.success('Acceso agregado', {
                duration: 6000,
              })
            }
            setMessage(target ? 'Acceso eliminado. Las sesiones abiertas siguen activas.' : 'Usa «Ingresar con mi dispositivo» al iniciar sesión.')
            setOpen(false)
            setTarget(null)
            setNombre('')
            await passkeys.refetch()
          } catch (error) {
            setError(error)
          } finally {
            setBusy(false)
          }
        }}>
          <PasskeyErrorAlert error={error} />
          {busy && <p role="status" className="rounded-xl bg-primary/5 p-3 text-sm">{target ? 'Eliminando el acceso…' : 'Sigue las indicaciones de tu dispositivo. Al terminar, confirmaremos el registro aquí.'}</p>}
          <fieldset disabled={busy} className="space-y-4">
            {target ? (
              <div className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
                <p className="break-words font-semibold">{target.nombre || `Acceso ${target.id}`}</p>
                <p className="text-muted-foreground">Ya no podrás ingresar con esta credencial. Las sesiones abiertas seguirán activas. Puede seguir apareciendo en el administrador de contraseñas de tu dispositivo; allí puedes eliminar su copia.</p>
              </div>
            ) : (
              <Field>
                <FieldLabel htmlFor="passkey-name">Nombre del acceso <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
                <InputGroup>
                  <InputGroupInput id="passkey-name" value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Por ejemplo: Mi laptop" aria-describedby="passkey-name-help" />
                  <InputGroupAddon><KeyRound aria-hidden="true" /></InputGroupAddon>
                </InputGroup>
                <FieldDescription id="passkey-name-help">Para identificar este acceso.</FieldDescription>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="passkey-password">Contraseña actual</FieldLabel>
              <InputGroup>
                <InputGroupInput ref={passwordRef} id="passkey-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" required aria-describedby="passkey-password-help" />
                <InputGroupAddon><LockKeyhole aria-hidden="true" /></InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} aria-controls="passkey-password" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription id="passkey-password-help">Es la contraseña de tu cuenta, no el PIN del dispositivo.</FieldDescription>
            </Field>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" variant={target ? 'destructive' : 'default'} disabled={busy || (!target && !supported)}>
                {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : target ? <Trash2 aria-hidden="true" /> : <Fingerprint aria-hidden="true" />}{busy ? 'Procesando…' : target ? 'Eliminar acceso' : 'Crear acceso'}
              </Button>

            </div>
          </fieldset>

        </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
