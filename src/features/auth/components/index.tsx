import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import LoginForm from '@/features/auth/components/LoginForm'
import SucursalPicker from '@/features/auth/components/SucursalPicker'
import { isSessionExpired, useAuthStore } from '@/features/core/store/auth-store'
import { useLoginMutation } from '../hooks/useLoginMutation'
import { seleccionarSucursalService } from '../services/auth-service'
import { requiereSeleccionSucursal } from '../types/auth'
import type { Sucursal } from '../types/auth'
import type { LoginFormValues } from '../types/form'
import { queryKeys } from '@/lib/query-keys'


export default function LoginFeature() {

  const toastId = 'login-request'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const refreshExpiresAt = useAuthStore((state) => state.refreshExpiresAt)
  const applySession = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const { mutateAsync: login, isPending } = useLoginMutation()
  const [seleccion, setSeleccion] = useState<{ sucursales: Sucursal[]; preToken: string } | null>(null)

  const completarSesion = (session: Parameters<typeof applySession>[0]) => {
    applySession(session)
    // Evita que un vendedor herede en caché el carrito/historial del usuario anterior.
    queryClient.removeQueries({ queryKey: queryKeys.sales.all })
    toast.success('Sesion iniciada', { id: toastId })
    navigate('/', { replace: true })
  }

  const performLogin = async (values: LoginFormValues) => {
    if (isPending) {
      return
    }

    try {
      toast.loading('Validando credenciales...', { id: toastId })

      const result = await login({
        username: values.username.trim(),
        password: values.password,
      })

      if (requiereSeleccionSucursal(result)) {
        setSeleccion({ sucursales: result.sucursales, preToken: result.pre_token })
        toast.dismiss(toastId)
        return
      }

      completarSesion(result)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al iniciar sesion'), { id: toastId })
    }
  }

  const performSeleccionSucursal = async (sucursalId: number) => {
    if (!seleccion) return
    try {
      toast.loading('Ingresando a la sucursal...', { id: toastId })
      const session = await seleccionarSucursalService(seleccion.preToken, sucursalId)
      completarSesion(session)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al seleccionar la sucursal'), { id: toastId })
    }
  }


  useEffect(() => {
    if (!user) return

    if (isSessionExpired({ user, token, refreshExpiresAt })) {
      logout()
      return
    }

    navigate('/', { replace: true })
  }, [logout, navigate, token, refreshExpiresAt, user])

  if (seleccion) {
    return <SucursalPicker sucursales={seleccion.sucursales} onSelect={performSeleccionSucursal} />
  }

  return (
    <LoginForm onSubmit={performLogin} />
  )
}
