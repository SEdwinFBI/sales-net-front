import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LoginFormValues } from '../types/form'
import { loginSchema } from '../utils/schema'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import {
  Fingerprint,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  MoveRight,
  User,
} from 'lucide-react'
import type { PatternLoginCredentials } from '../types/pattern'
import PatternLoginForm from './PatternLoginForm'
import { supportsPasskeys } from '../services/passkey-service'
import PasskeyErrorAlert from './PasskeyErrorAlert'

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => Promise<void>
  onPasskeySubmit: () => Promise<void>
  onPatternSubmit: (values: PatternLoginCredentials) => Promise<void>
}

export default function LoginForm({ onSubmit, onPatternSubmit, onPasskeySubmit }: LoginFormProps) {
  const [passkeyPending, setPasskeyPending] = useState(false)
  const [passkeyError, setPasskeyError] = useState<unknown>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [usePattern, setUsePattern] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const handleFormSubmit = handleSubmit(onSubmit)

  if (usePattern) {
    return <PatternLoginForm onSubmit={onPatternSubmit} onBack={() => setUsePattern(false)} />
  }

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa con tus credenciales para continuar
        </p>
      </div>

      <form className="mt-6 flex flex-col gap-5" onSubmit={handleFormSubmit}>
        <fieldset disabled={passkeyPending} className="min-w-0">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="username">Usuario</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  {...register('username')}
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="Tu nombre de usuario"
                  aria-invalid={!!errors.username}
                />
                <InputGroupAddon>
                  <User aria-hidden="true" />
                </InputGroupAddon>
              </InputGroup>
              {errors.username ? (
                <FieldDescription role="alert" className="text-xs font-medium text-destructive">
                  {errors.username.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                />
                <InputGroupAddon>
                  <LockKeyhole aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    className="text-muted-foreground hover:bg-transparent hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.password ? (
                <FieldDescription role="alert" className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
        </fieldset>

        <Button
          className="group/submit w-full font-semibold"
          type="submit"
          size="lg"
          disabled={isSubmitting || passkeyPending}
        >
          <span>{isSubmitting ? 'Iniciando sesión…' : 'Ingresar'}</span>
          {isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <MoveRight
              aria-hidden="true"
              className="transition-transform duration-150 group-hover/submit:translate-x-1"
            />
          )}
        </Button>
      </form>

      <div className="mt-6 space-y-2.5">
        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-border/80" />
          <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Otros accesos
          </span>
          <div className="flex-1 border-t border-border/80" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="group/passkey h-auto min-h-14 w-full justify-start gap-3 whitespace-normal rounded-2xl border-border/90 bg-muted/30 p-3 text-foreground shadow-none transition-all hover:border-primary/45 hover:bg-primary/[0.06] hover:shadow-xs focus-visible:ring-primary/30 motion-reduce:transition-none"
          disabled={!supportsPasskeys() || isSubmitting || passkeyPending}
          aria-busy={passkeyPending}
          onClick={async () => {
            setPasskeyPending(true)
            setPasskeyError(null)
            try {
              await onPasskeySubmit()
            } catch (error) {
              setPasskeyError(error)
            } finally {
              setPasskeyPending(false)
            }
          }}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover/passkey:bg-primary group-hover/passkey:text-primary-foreground">
            {passkeyPending ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
            ) : (
              <Fingerprint aria-hidden="true" className="size-5" />
            )}
          </span>
          <span className="flex-1 text-left">
            <span className="block text-sm font-semibold leading-tight text-foreground">
              {passkeyPending ? 'Esperando tu dispositivo…' : 'Ingresar con mi dispositivo'}
            </span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Huella digital, rostro o PIN
            </span>
          </span>
          <MoveRight
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-hover/passkey:translate-x-1 group-hover/passkey:text-primary motion-reduce:transform-none motion-reduce:transition-none"
          />
        </Button>

        {!supportsPasskeys() && (
          <p className="text-xs text-muted-foreground">
            El acceso con dispositivo requiere un navegador compatible y una conexión segura.
          </p>
        )}
        <div className="empty:hidden">
          <PasskeyErrorAlert error={passkeyError} />
        </div>

        <Button
          className="group/pattern h-auto min-h-14 w-full justify-start gap-3 whitespace-normal rounded-2xl border-border/90 bg-muted/30 p-3 text-foreground shadow-none transition-all hover:border-primary/45 hover:bg-primary/[0.06] hover:shadow-xs focus-visible:ring-primary/30 motion-reduce:transition-none"
          type="button"
          variant="outline"
          disabled={isSubmitting || passkeyPending}
          onClick={() => setUsePattern(true)}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover/pattern:bg-primary group-hover/pattern:text-primary-foreground">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path
                d="M5 5H12L5 12H19L12 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[5, 12, 19].flatMap((cy) =>
                [5, 12, 19].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />),
              )}
            </svg>
          </span>
          <span className="flex-1 text-left">
            <span className="block text-sm font-semibold leading-tight text-foreground">
              Ingresar mediante patrón
            </span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Conecta tus puntos de acceso
            </span>
          </span>
          <MoveRight
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-hover/pattern:translate-x-1 group-hover/pattern:text-primary motion-reduce:transform-none motion-reduce:transition-none"
          />
        </Button>
      </div>
    </>
  )
}
