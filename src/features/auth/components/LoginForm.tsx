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
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Eye, EyeOff, LockKeyhole, Loader2, Mail, MoveRight } from 'lucide-react'
import type { PatternLoginCredentials } from '../types/pattern'
import PatternLoginForm from './PatternLoginForm'
import RotateHover from '@/components/motion/RotateHover'




type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => Promise<void>
  onPatternSubmit: (values: PatternLoginCredentials) => Promise<void>
}

export default function LoginForm({ onSubmit, onPatternSubmit }: LoginFormProps) {
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
        <h1 className="font-heading text-2xl font-semibold text-neutral">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa con tus credenciales para acceder al sistema
        </p>
      </div>

      <form className="mt-7 space-y-5" onSubmit={handleFormSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Correo o usuario</FieldLabel>
                  <InputGroup >
                    <InputGroupInput
                      {...register('username')}
                      id="username"
                      type="text"
                      placeholder="usuario@distribuidoramz.com"
                      aria-invalid={!!errors.username} />
                    <InputGroupAddon>
                      <Mail />
                    </InputGroupAddon>

                  </InputGroup>
                  {errors.username ?
                    <FieldDescription className="text-sm text-destructive">{errors.username.message}
                    </FieldDescription> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <InputGroup >
                    <InputGroupInput
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      aria-invalid={!!errors.password} />
                    <InputGroupAddon>
                      <LockKeyhole />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        className={"hover:bg-transparent hover:shadow-none active:bg-transparent active:scale-100 transition-none"}
                        aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>

                  {errors.password ? <FieldDescription className="text-sm text-destructive">{errors.password.message}</FieldDescription> : null}
                </Field>
              </FieldGroup>
              <RotateHover rotate={0.7}>
                <Button className={"w-full font-bold!"} type='submit' size={'lg'} disabled={isSubmitting}>
                  {isSubmitting ? 'Iniciando…' : 'Ingresar'} {isSubmitting ? <Loader2 className="animate-spin" /> : <MoveRight />}
                </Button>
              </RotateHover>

      </form>
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-3 text-center text-xs text-muted-foreground">Otros tipos de acceso</p>
        <Button
          className="group/pattern h-auto min-h-16 w-full justify-start gap-3 whitespace-normal rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-primary-complement/5 p-3 text-primary-complement shadow-sm transition-all hover:border-primary/50 hover:bg-primary/15 hover:text-primary-complement hover:shadow-md focus-visible:ring-primary/30 motion-reduce:transition-none"
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => setUsePattern(true)}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors group-hover/pattern:bg-primary-complement">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor">
              <path d="M5 5H12L5 12H19L12 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {[5, 12, 19].flatMap((cy) => [5, 12, 19].map((cx) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />
              )))}
            </svg>
          </span>
          <span className="flex-1 text-left font-semibold">Ingresar mediante patrón</span>
          <MoveRight aria-hidden="true" className="size-4 transition-transform group-hover/pattern:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" />
        </Button>
      </div>
    </>
  )
}
