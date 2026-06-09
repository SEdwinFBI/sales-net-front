import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCreateUsuario } from '../hooks/useCreateUsuario'
import { useUpdateUsuario } from '../hooks/useUpdateUsuario'
import type { Usuario } from '../types/usuario-types'
import { toast } from 'sonner'

const schema = z.object({
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido').or(z.literal('')),
  role: z.enum(['admin', 'vendedor']),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  usuario?: Usuario | null
  onClose: () => void
}

export default function UsuarioDialog({ open, usuario, onClose }: Props) {
  const isEdit = !!usuario
  const { mutateAsync: createUsuario, isPending: isCreating } = useCreateUsuario()
  const { mutateAsync: updateUsuario, isPending: isUpdating } = useUpdateUsuario()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { first_name: '', last_name: '', username: '', email: '', password: '', role: 'vendedor' },
  })

  useEffect(() => {
    if (open) {
      reset(
        usuario
          ? { first_name: usuario.first_name, last_name: usuario.last_name, username: usuario.username, email: usuario.email, password: '', role: usuario.role as 'admin' | 'vendedor' }
          : { first_name: '', last_name: '', username: '', email: '', password: '', role: 'vendedor' }
      )
    }
  }, [open, usuario, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (!isEdit && !values.password) {
        toast.error('La contraseña es requerida')
        return
      }

      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.username,
        role: values.role,
        ...(values.email ? { email: values.email } : {}),
        ...(values.password ? { password: values.password } : {}),
      }
      if (isEdit) {
        await updateUsuario({ id: usuario.id, ...payload })
        toast.success('Usuario actualizado correctamente')
      } else {
        await createUsuario({ ...payload, password: values.password })
        toast.success('Usuario creado correctamente')
      }
      onClose()
    } catch {
      toast.error('Error al guardar el usuario')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...register('first_name')} placeholder="Ej. Juan Carlos" />
              <FieldError errors={[errors.first_name]} />
            </Field>

            <Field>
              <FieldLabel>Apellido</FieldLabel>
              <Input {...register('last_name')} placeholder="Ej. Perez Lopez" />
              <FieldError errors={[errors.last_name]} />
            </Field>

            <Field>
              <FieldLabel>Correo (opcional)</FieldLabel>
              <Input {...register('email')} type="email" placeholder="Ej. juan.perez@tipicos.com" />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input {...register('username')} placeholder="Ej. juan.perez" />
              <FieldError errors={[errors.username]} />
            </Field>

            <Field>
              <FieldLabel>{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}</FieldLabel>
              <Input {...register('password')} type="password" placeholder="Ej. Tipicos2026" />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel>Rol</FieldLabel>
              <select
                {...register('role')}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="vendedor">Vendedor</option>
                <option value="admin">Admin</option>
              </select>
              <FieldError errors={[errors.role]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
