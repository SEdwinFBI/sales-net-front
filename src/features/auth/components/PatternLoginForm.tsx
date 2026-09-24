import { useRef, useState } from 'react'
import { Loader2, UserRound, MoveRight, LockKeyhole, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { getPatternLoginErrorMessage, getPatternLockSeconds, getPatternLockMessage } from '../utils/pattern-login-error'
import type { PatternLoginCredentials } from '../types/pattern'
import { usePatternLoginLock } from '../hooks/usePatternLoginLock'
import PatternInput from './PatternInput'

type PatternLoginFormProps = {
  onBack: () => void
  onSubmit: (values: PatternLoginCredentials) => Promise<void>
}

export default function PatternLoginForm({ onBack, onSubmit }: PatternLoginFormProps) {
  const [username, setUsername] = useState('')
  const [pattern, setPattern] = useState<number[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitting = useRef(false)
  const { remainingSeconds, message: lockMessage, duration, lock, isLocked } = usePatternLoginLock(username)
  const blocked = remainingSeconds > 0
  const countdown = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`

  return (
    <form noValidate className="w-full space-y-5" aria-label="Ingreso con patrón" onSubmit={async (event) => {
      event.preventDefault()
      if (submitting.current || isLocked()) return
      if (!username.trim()) {
        setError('Ingresa tu usuario para identificar tu cuenta.')
        return
      }
      if (pattern.length < 6) {
        setError('Conecta al menos 6 puntos en el orden de tu patrón registrado.')
        return
      }
      submitting.current = true
      setIsSubmitting(true)
      setError('')
      try {
        await onSubmit({ username: username.trim(), patron: pattern })
      } catch (error) {
        const seconds = getPatternLockSeconds(error)
        if (seconds !== null && seconds > 0) {
          lock(seconds, getPatternLockMessage(error))
          setError('')
        } else {
          setError(getPatternLoginErrorMessage(error))
        }
      } finally {
        setPattern([])
        submitting.current = false
        setIsSubmitting(false)
      }
    }}>
      <Field>
        <FieldLabel htmlFor="pattern-username">Nombre de usuario</FieldLabel>
        <InputGroup>
          <InputGroupInput id="pattern-username" placeholder="Ingresa tu usuario" aria-describedby="pattern-username-help" autoCapitalize="none" spellCheck={false} autoComplete="username" value={username} disabled={isSubmitting} required
            onChange={(event) => { setUsername(event.target.value); setPattern([]); setError('') }} />
          <InputGroupAddon><UserRound /></InputGroupAddon>
        </InputGroup>
        <FieldDescription id="pattern-username-help" className="text-sm">El mismo que usas con tu contraseña.</FieldDescription>
      </Field>
      {blocked ? (
        <section aria-labelledby="pattern-lock-title" className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary-complement/5 p-5 text-center sm:p-6">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <LockKeyhole aria-hidden="true" className="size-6" />
          </div>
          <div role="alert" className="space-y-2">
            <h2 id="pattern-lock-title" className="font-heading text-xl font-semibold text-foreground">Acceso temporalmente bloqueado</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{lockMessage}</p>
          </div>
          <div className="mt-5 space-y-3 rounded-xl border border-primary/15 bg-card/80 p-4">
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Clock3 aria-hidden="true" className="size-4" /> Tiempo restante</p>
            <p role="timer" aria-live="off" aria-label={`Tiempo restante: ${countdown}`} className="font-heading text-4xl font-semibold tabular-nums tracking-wide text-primary-complement">{countdown}</p>
            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${Math.min(100, remainingSeconds / duration * 100)}%` }} />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">El formulario se habilitará al terminar la cuenta regresiva.</p>
        </section>
      ) : <Field className="gap-3">
        <div className="space-y-1">
          <FieldTitle>Patrón de acceso</FieldTitle>
          <p id="pattern-help" className="text-sm text-muted-foreground">
            Dibuja tu patrón de al menos 6 puntos.
            <span className="sr-only"> También puedes seleccionarlos con Tab y Enter o espacio.</span>
          </p>
        </div>
        <div className="mx-auto w-full max-w-80 [&_p]:text-sm [&_button]:text-sm">
        <PatternInput className="max-w-none border-primary/20 bg-primary/5" value={pattern} disabled={isSubmitting || blocked} onChange={(value) => {
          setPattern(value)
          setError('')
        }} />
        </div>
        <FieldDescription className="text-sm">Después de 5 intentos fallidos, se bloquea el acceso por patrón.</FieldDescription>
        {!blocked && error && <FieldDescription role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-destructive">{error}</FieldDescription>}
      </Field>}
      <div className="space-y-1 pt-1">
      {!blocked && <Button className="w-full font-bold!" type="submit" size="lg" disabled={isSubmitting || blocked}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar con patrón'} {isSubmitting ? <Loader2 className="animate-spin" /> : <MoveRight />}
      </Button>}
      <Button className="w-full" type="button" variant="ghost" disabled={isSubmitting} onClick={onBack}>Volver a usuario y contraseña</Button>
      </div>
    </form>
  )
}
