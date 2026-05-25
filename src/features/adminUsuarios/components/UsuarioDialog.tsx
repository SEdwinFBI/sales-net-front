import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
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
import type { AppRole } from '@/features/auth/types/auth'
import { toast } from 'sonner'

const baseSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  role: z.enum(['admin', 'vendedor']),
  password: z.string(),
})

const createSchema = baseSchema.extend({
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
})

const editSchema = baseSchema.extend({
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres').or(z.literal('')),
})

type FormValues = {
  fullName: string
  username: string
  password: string
  role: AppRole
}

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
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { fullName: '', username: '', password: '', role: 'vendedor' },
  })

  useEffect(() => {
    if (open) {
      reset(
        usuario
          ? { fullName: usuario.fullName, username: usuario.username, password: '', role: usuario.role }
          : { fullName: '', username: '', password: '', role: 'vendedor' }
      )
    }
  }, [open, usuario, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateUsuario({
          id: usuario.id,
          fullName: values.fullName,
          username: values.username,
          role: values.role,
          ...(values.password ? { password: values.password } : {}),
        })
        toast.success('Usuario actualizado correctamente')
      } else {
        await createUsuario({
          fullName: values.fullName,
          username: values.username,
          password: values.password,
          role: values.role,
        })
        toast.success('Usuario creado correctamente')
      }
      onClose()
    } catch {
      toast.error('Error al guardar el usuario')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre completo</FieldLabel>
              <Input {...register('fullName')} placeholder="Juan Pérez" />
              <FieldError errors={[errors.fullName]} />
            </Field>

            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input {...register('username')} placeholder="juan.perez" />
              <FieldError errors={[errors.username]} />
            </Field>

            <Field>
              <FieldLabel>{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}</FieldLabel>
              <Input {...register('password')} type="password" placeholder="••••••••" />
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
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}