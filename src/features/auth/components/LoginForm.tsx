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
import RotateHover from '@/components/motion/RotateHover'




type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
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
    </>
  )
}
