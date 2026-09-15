import { useState } from 'react'
import { Check, ChevronRight, RotateCcw, ShieldCheck, Loader2, LockKeyhole, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { useCreatePatternMutation } from '@/features/auth/hooks/useCreatePatternMutation'
import { getPatternErrorMessage } from '@/features/auth/utils/pattern-error'
import PatternInput from '@/features/auth/components/PatternInput'

const steps = ['Contraseña', 'Crear patrón', 'Confirmar patrón', 'Guardar patrón']

export default function PatternSetupForm() {
  const [step, setStep] = useState(-1)
  const [pattern, setPattern] = useState<number[]>([])
  const [original, setOriginal] = useState<number[]>([])
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const { mutateAsync, isPending, reset } = useCreatePatternMutation()

  const restart = () => {
    if (isPending) return
    reset()
    setPassword('')
    setSaved(false)
    setStep(-1)
    setShowPassword(false)
    setPattern([])
    setOriginal([])
    setError('')
  }

  return (
    <Card className="gap-4 p-4 sm:p-5">
      <ol aria-label="Pasos para configurar el patrón" className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border pb-4">
        {steps.map((label, index) => (
          <li key={label} aria-current={step + 1 === index ? 'step' : undefined} className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row">
            <span className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${index <= step + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {index < step + 1 ? <Check aria-hidden="true" className="size-4" /> : index + 1}
            </span>
            <span className={`text-xs sm:text-sm ${index === step + 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === -1 ? (
        <form noValidate className="grid gap-4" onSubmit={(event) => {
          event.preventDefault()
          if (!password.trim()) {
            setError('Escribe la contraseña que utilizas para iniciar sesión. Puedes usar el ícono del ojo para revisar lo que escribiste.')
            return
          }
          setShowPassword(false)
          setError('')
          setStep(0)
        }}>
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold">Ingresa tu contraseña actual</h2>
            <p className="text-sm text-muted-foreground">Después podrás crear y confirmar tu patrón. La contraseña se comprobará al guardar.</p>
          </div>
          <Field>
            <FieldLabel htmlFor="pattern-current-password">Contraseña actual</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="pattern-current-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                value={password} required
                onChange={(event) => { setPassword(event.target.value); setError('') }}
                aria-invalid={!!error} aria-describedby={error ? 'pattern-password-error' : undefined}
              />
              <InputGroupAddon><LockKeyhole /></InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          {error && <p id="pattern-password-error" role="alert" className="whitespace-pre-line rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">{error}</p>}
          <div className="flex justify-end border-t border-border pt-3">
            <Button type="submit">Continuar <ChevronRight aria-hidden="true" /></Button>
          </div>
        </form>
      ) : step < 2 ? (
        <form noValidate className="grid gap-4" onSubmit={(event) => {
          event.preventDefault()
          if (pattern.length < 6) {
            setError(`Seleccionaste ${pattern.length} de los 6 puntos mínimos. Conecta puntos diferentes; usa «Limpiar patrón» si quieres volver a dibujarlo.`)
            return
          }
          if (step === 0) {
            setOriginal([...pattern])
            setPattern([])
            setStep(1)
          } else if (pattern.join(',') !== original.join(',')) {
            setError('La confirmación no coincide con el primer patrón. Repite los mismos puntos, con el mismo inicio y en el mismo orden. Si no recuerdas el patrón, selecciona «Empezar de nuevo».')
            setPattern([])
          } else {
            setStep(2)
          }
        }}>
          <div className="space-y-2 text-center">
            <h2 className="font-heading text-lg font-semibold">{step === 0 ? 'Dibuja tu nuevo patrón' : 'Repite tu patrón'}</h2>
            <p id="pattern-help" className="text-sm text-muted-foreground">
              {step === 0 ? 'Conecta al menos 6 puntos sin repetirlos. Si cruzas un punto intermedio, también se selecciona.' : 'Conecta los mismos puntos en el mismo orden.'}
              <span className="sr-only"> También puedes usar Tab y Enter o espacio para seleccionar los puntos.</span>
            </p>
          </div>
          <div className="mx-auto w-full max-w-96">
            <PatternInput className="max-w-none" key={step} value={pattern} onChange={(value) => { setPattern(value); setError('') }} />
          </div>
          {error && <p role="alert" className="whitespace-pre-line rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={restart} >
              <RotateCcw aria-hidden="true" /> Empezar de nuevo
            </Button>
            <Button type="submit">
              {step === 0 ? 'Continuar' : 'Confirmar patrón'} <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={async (event) => {
          event.preventDefault()
          if (isPending || saved) return
          if (!password.trim()) {
            setError('Escribe la contraseña que utilizas para iniciar sesión. Puedes usar el ícono del ojo para revisar lo que escribiste.')
            return
          }
          setError('')
          try {
            await mutateAsync({ current_password: password, patron: original, confirmar_patron: pattern })
            setSaved(true)
            setOriginal([])
            setPattern([])
          } catch (error) {
            setError(`${getPatternErrorMessage(error)}\nPor seguridad, vuelve a ingresar la contraseña y dibujar el patrón.`)
            setStep(-1)
            setPattern([])
            setOriginal([])
          } finally {
            setPassword('')
            reset()
          }
        }}>
          <div className="flex flex-col items-center gap-3 py-3 text-center" role="status">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck aria-hidden="true" className="size-7" /></span>
            <h2 className="font-heading text-lg font-semibold">{saved ? 'Patrón guardado' : 'Patrón confirmado'}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {saved ? 'Tu patrón se guardó correctamente en tu cuenta.' : 'Tu patrón está listo. Confirma para guardarlo en tu cuenta.'}
            </p>
          </div>

          {error && <p id="pattern-save-error" role="alert" className="whitespace-pre-line rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" disabled={isPending} onClick={restart}>
              <RotateCcw aria-hidden="true" /> {saved ? 'Crear otro patrón' : 'Empezar de nuevo'}
            </Button>
            {!saved && <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <ShieldCheck aria-hidden="true" />}
              {isPending ? 'Guardando…' : 'Guardar patrón'}
            </Button>}
          </div>
        </form>
      )}
    </Card>
  )
}
