import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import LoginForm from '@/features/auth/components/LoginForm'
import { isSessionExpired, useAuthStore } from '@/features/core/store/auth-store'
import { useLoginMutation } from '../hooks/useLoginMutation'
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

  const performLogin = async (values: LoginFormValues) => {
    if (isPending) {
      return
    }

    try {
      toast.loading('Validando credenciales...', { id: toastId })

      const session = await login({
        username: values.username.trim(),
        password: values.password,
      })

      applySession(session)
      queryClient.removeQueries({ queryKey: queryKeys.sales.all })
      toast.success('Sesion iniciada', { id: toastId })
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error al iniciar sesion'), { id: toastId })
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

  return (
    <LoginForm onSubmit={performLogin} />
  )
}
