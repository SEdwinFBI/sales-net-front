import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LoginFormValues } from '../types/form'
import { loginSchema } from '../utils/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Eye, EyeOff, LockKeyhole, Mail, MoveRight } from 'lucide-react'
import SlideVertical from '@/components/motion/SlideVertical'
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

      <SlideVertical
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Iniciar Sesion
            </CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>

            <form className="mt-8 space-y-5 " onSubmit={handleFormSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Email Address</FieldLabel>
                  <InputGroup >
                    <InputGroupInput
                      {...register('username')}
                      id="username"
                      type="text"
                      placeholder="admin@tailadmin.com"
                      aria-invalid={!!errors.username} />
                    <InputGroupAddon>
                      <Mail />
                    </InputGroupAddon>

                  </InputGroup>
                  {errors.username ?
                    <FieldDescription className="text-sm text-(--color-danger)">{errors.username.message}
                    </FieldDescription> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
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

                  {errors.password ? <FieldDescription className="text-sm text-(--color-danger)">{errors.password.message}</FieldDescription> : null}
                </Field>
              </FieldGroup>
              <RotateHover rotate={0.7}>
                <Button className={"w-full font-bold!"} type='submit' size={'lg'} disabled={isSubmitting}>
                  {isSubmitting ? 'Iniciando...' : 'Login'} <MoveRight />
                </Button>
              </RotateHover>

            </form>
          </CardContent>
        </Card>
      </SlideVertical>
    </>
  )
}
