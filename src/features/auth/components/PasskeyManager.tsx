import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Eye, EyeOff, Fingerprint, KeyRound, Loader2, LockKeyhole, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { deletePasskey, listPasskeys, registerPasskey, supportsPasskeys } from '../services/passkey-service'
import type { Passkey } from '../services/passkey-service'
import { getPasskeyErrorMessage } from '../utils/passkey-error'

export default function PasskeyManager({ userId }: { userId: number }) {
  const passwordRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [nombre, setNombre] = useState('')
  const [target, setTarget] = useState<Passkey | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const passkeys = useQuery({ queryKey: ['passkeys', userId], queryFn: listPasskeys, retry: false })
  const supported = supportsPasskeys()

  return (
    <div className="grid min-w-0 gap-4">
      <Card className="gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${target ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {target ? <Trash2 aria-hidden="true" className="size-5" /> : <Plus aria-hidden="true" className="size-5" />}
          </span>
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold">{target ? 'Revocar passkey' : 'Agrega una nueva passkey'}</h2>
            <p className="text-sm text-muted-foreground">{target ? 'Confirma tu identidad para eliminar este método de acceso.' : 'Asigna un nombre, confirma tu contraseña y sigue las indicaciones de tu dispositivo.'}</p>
          </div>
        </div>
        {!supported && <p role="status" className="rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">Este navegador no permite agregar passkeys aquí. Puedes administrar las existentes o usar un navegador compatible con HTTPS o localhost.</p>}
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault()
          if (busy || !passwordRef.current?.value) return
          const password = passwordRef.current.value
          passwordRef.current.value = ''
          setShowPassword(false)
          setBusy(true)
          setError('')
          setMessage('')
          try {
            if (target) await deletePasskey(target.id, password)
            else {
              await registerPasskey(password, nombre)
              toast.success('Passkey creada correctamente', {
                description: 'Ya puedes usar «Ingresar con mi dispositivo» para acceder a tu cuenta.',
                duration: 6000,
              })
            }
            setMessage(target ? 'Passkey revocada. Las sesiones abiertas siguen activas.' : 'Passkey agregada. Ya puedes ingresar con tu dispositivo.')
            setTarget(null)
            setNombre('')
            await passkeys.refetch()
          } catch (error) {
            setError(getPasskeyErrorMessage(error))
          } finally {
            setBusy(false)
          }
        }}>
          <fieldset disabled={busy} className="space-y-4">
            {target ? (
              <div className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
                <p className="break-words font-semibold">{target.nombre || `Passkey ${target.id}`}</p>
                <p className="text-muted-foreground">Ya no podrás ingresar con esta credencial. Las sesiones abiertas seguirán activas.</p>
              </div>
            ) : (
              <Field>
                <FieldLabel htmlFor="passkey-name">Nombre de la passkey <span className="font-normal text-muted-foreground">(opcional)</span></FieldLabel>
                <InputGroup>
                  <InputGroupInput id="passkey-name" value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Por ejemplo: Mi laptop" aria-describedby="passkey-name-help" />
                  <InputGroupAddon><KeyRound aria-hidden="true" /></InputGroupAddon>
                </InputGroup>
                <FieldDescription id="passkey-name-help">Un nombre te ayudará a reconocerla cuando quieras administrarla.</FieldDescription>
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
              <FieldDescription id="passkey-password-help">Usa la contraseña con la que ingresas a tu cuenta para confirmar esta acción.</FieldDescription>
            </Field>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button type="submit" variant={target ? 'destructive' : 'default'} disabled={busy || (!target && !supported)}>
                {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : target ? <Trash2 aria-hidden="true" /> : <Fingerprint aria-hidden="true" />}{busy ? 'Procesando…' : target ? 'Confirmar revocación' : 'Agregar passkey'}
              </Button>
              {target && <Button type="button" variant="outline" onClick={() => { setTarget(null); setShowPassword(false); setError(''); if (passwordRef.current) passwordRef.current.value = '' }}>Cancelar</Button>}
            </div>
          </fieldset>
          {error && <p role="alert" className="whitespace-pre-line rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          {message && <p role="status" className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />{message}</p>}
        </form>
        <p className="text-xs text-muted-foreground">Tu contraseña sigue disponible para ingresar si pierdes acceso a tus passkeys.</p>
      </Card>
      <Card className="gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1"><h2 className="font-heading text-lg font-semibold">Tus passkeys</h2><p className="text-sm text-muted-foreground">Administra las credenciales de acceso de tu cuenta.</p></div>
          {!passkeys.isError && passkeys.data && <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary" aria-label={`${passkeys.data.length} passkeys registradas`}>{passkeys.data.length}</span>}
        </div>
        {passkeys.isPending && <p role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-4 animate-spin" />Cargando passkeys…</p>}
        {passkeys.isError && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{getPasskeyErrorMessage(passkeys.error)}</p><Button variant="outline" disabled={passkeys.isFetching || busy} onClick={() => void passkeys.refetch()}>Reintentar</Button></div>}
        {!passkeys.isError && passkeys.data?.length === 0 && <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Fingerprint aria-hidden="true" className="size-6" /></span>
          <div className="space-y-1"><p className="font-medium">Tu primera passkey empieza aquí</p><p className="text-sm text-muted-foreground">Completa el formulario para activar el ingreso con tu dispositivo.</p></div>
        </div>}
        {!passkeys.isError && <ul className="space-y-3">{passkeys.data?.map((passkey) => (
          <li key={passkey.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 sm:p-4 ${target?.id === passkey.id ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
            <div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><KeyRound aria-hidden="true" className="size-4" /></span><span className="min-w-0 break-words text-sm font-medium">{passkey.nombre || `Passkey ${passkey.id}`}</span></div>
            <Button type="button" variant="outline" disabled={busy} aria-label={`Revocar ${passkey.nombre || `passkey ${passkey.id}`}`} onClick={() => {
              setTarget(passkey); setShowPassword(false); setError(''); setMessage('')
              if (passwordRef.current) { passwordRef.current.value = ''; passwordRef.current.focus() }
            }}><Trash2 aria-hidden="true" />Revocar</Button>
          </li>
        ))}</ul>}
      </Card>
    </div>
  )
}
