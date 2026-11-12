import { useEffect, useRef, useState } from 'react'
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
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TimeInput } from '@/components/ui/time-input'
import { Loader2 } from 'lucide-react'
import { useCreateUsuario } from '../hooks/useCreateUsuario'
import { useUpdateUsuario } from '../hooks/useUpdateUsuario'
import type { Usuario } from '../types/usuario-types'
import { useSucursales } from '@/features/admin'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAgentTools } from '@/features/agent/registry/useAgentTools'
import { commitTool, submitForm } from '@/features/agent/commit-tools'
import { buildUsuarioDialogTools, type UsuarioFormValues } from '../../agent/usuarios-tools'

const schema = z.object({
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido').or(z.literal('')),
  role: z.enum(['admin', 'vendedor']),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').or(z.literal('')),
  hora_entrada: z.string().regex(/^\d{2}:\d{2}$/, 'Formato requerido: HH:MM'),
  hora_salida: z.string().regex(/^\d{2}:\d{2}$/, 'Formato requerido: HH:MM'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  usuario?: Usuario | null
  /** Valores que se superponen a los defaults o a los datos del usuario al abrir (los usa el agente). Nunca incluye contraseña. */
  initialValues?: Partial<UsuarioFormValues>
  onClose: () => void
}

export default function UsuarioDialog({ open, usuario, initialValues, onClose }: Props) {
  const isEdit = !!usuario
  const { mutateAsync: createUsuario, isPending: isCreating } = useCreateUsuario()
  const { mutateAsync: updateUsuario, isPending: isUpdating } = useUpdateUsuario()
  const { data: sucursales } = useSucursales()
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<Set<number>>(new Set())
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { first_name: '', last_name: '', username: '', email: '', password: '', role: 'vendedor', hora_entrada: '04:00', hora_salida: '16:00' },
  })
  const role = watch('role')

  // En una ref para que cambiar la identidad del prop no reinicie el formulario ya abierto: solo se usa al abrir.
  const initialRef = useRef(initialValues)
  useEffect(() => {
    initialRef.current = initialValues
  })

  useEffect(() => {
    if (open) {
      const { sucursales: sucursalesIniciales, ...camposIniciales } = initialRef.current ?? {}
      reset({
        ...(usuario
          ? { first_name: usuario.first_name, last_name: usuario.last_name, username: usuario.username, email: usuario.email, password: '', role: usuario.role as 'admin' | 'vendedor', hora_entrada: usuario.hora_entrada?.slice(0, 5) ?? '', hora_salida: usuario.hora_salida?.slice(0, 5) ?? '' }
          : { first_name: '', last_name: '', username: '', email: '', password: '', role: 'vendedor' as const, hora_entrada: '04:00', hora_salida: '16:00' }),
        ...camposIniciales,
      })
      setSucursalesSeleccionadas(new Set(sucursalesIniciales ?? usuario?.sucursales ?? []))
    }
  }, [open, usuario, reset])

  // Mientras el diálogo está abierto, el agente puede llenar el formulario (nunca guardarlo). La contraseña
  // no existe para él: ni se llena ni se lee, y `getValues` la deja fuera de forma explícita.
  useAgentTools(
    'usuario-dialog',
    open
      ? buildUsuarioDialogTools({
          getRole: () => getValues('role') ?? null,
          getSucursalIds: () => sucursales?.map((s) => s.id),
          getValues: () => {
            const v = getValues()
            return {
              first_name: v.first_name,
              last_name: v.last_name,
              email: v.email,
              username: v.username,
              role: v.role,
              hora_entrada: v.hora_entrada,
              hora_salida: v.hora_salida,
              sucursales: Array.from(sucursalesSeleccionadas),
            }
          },
          setValues: (values) => {
            for (const key of ['first_name', 'last_name', 'email', 'username', 'role', 'hora_entrada', 'hora_salida'] as const) {
              if (key in values) setValue(key, values[key] as never, { shouldValidate: true, shouldDirty: true })
            }
            if (values.sucursales) setSucursalesSeleccionadas(new Set(values.sucursales))
          },
        })
      : null,
  )

  const toggleSucursal = (id: number, checked: boolean) => {
    setSucursalesSeleccionadas((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      if (!isEdit && !values.password) {
        toast.error('La contraseña es requerida')
        return false
      }

      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.username,
        role: values.role,
        hora_entrada: values.hora_entrada,
        hora_salida: values.hora_salida,
        ...(values.role === 'vendedor' ? { sucursales: Array.from(sucursalesSeleccionadas) } : {}),
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
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al guardar el usuario'))
      return false
    }
  }

  // Solo con las acciones de guardado activadas: el agente presiona el botón tras un clic de confirmación.
  // La contraseña la escribe siempre el usuario: aquí solo se comprueba si el campo está vacío.
  useAgentTools(
    'usuario-dialog-guardar',
    open
      ? [
          commitTool({
            name: 'guardar_usuario',
            description: 'Guarda el formulario de usuario abierto (crea el usuario o guarda los cambios). No escribe la contrasena: la escribe el usuario.',
            validar: () => {
              if (isPending) return 'Ya se esta guardando.'
              if (!isEdit && !getValues('password')) return 'Falta que el usuario escriba la contraseña antes de guardar.'
              return getValues('role') === 'vendedor' && sucursalesSeleccionadas.size === 0 ? 'Un vendedor debe tener al menos una sucursal asignada.' : null
            },
            texto: () => `${isEdit ? 'Guardar los cambios del usuario' : 'Crear el usuario'} ${getValues('username') || '(sin username)'} con rol ${getValues('role')}`,
            run: () => submitForm(handleSubmit, onSubmit),
          }),
        ]
      : null,
  )

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
              <Select {...register('role')}>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Admin</option>
              </Select>
              <FieldError errors={[errors.role]} />
            </Field>

            <Field>
              <FieldLabel>Hora de entrada</FieldLabel>
              <TimeInput {...register('hora_entrada')} />
              <FieldError errors={[errors.hora_entrada]} />
            </Field>

            <Field>
              <FieldLabel>Hora de salida</FieldLabel>
              <TimeInput {...register('hora_salida')} />
              <FieldError errors={[errors.hora_salida]} />
            </Field>
          </FieldGroup>

          {role === 'vendedor' && (
            <div className="mt-4 space-y-2">
              <FieldLabel>Sucursales</FieldLabel>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {sucursales.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">No hay sucursales registradas.</p>
                ) : (
                  sucursales.map((sucursal) => (
                    <label
                      key={sucursal.id}
                      className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted/40"
                    >
                      <Switch
                        size="sm"
                        checked={sucursalesSeleccionadas.has(sucursal.id)}
                        onCheckedChange={(checked) => toggleSucursal(sucursal.id, checked === true)}
                      />
                      <span className="truncate">{sucursal.nombre}</span>
                    </label>
                  ))
                )}
              </div>
              {sucursalesSeleccionadas.size === 0 && (
                <p className="text-xs text-destructive">Un vendedor debe tener al menos una sucursal asignada.</p>
              )}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
