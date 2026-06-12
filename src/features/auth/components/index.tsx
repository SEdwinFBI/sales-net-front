import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import LoginForm from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useLoginMutation } from '../hooks/useLoginMutation'
import type { LoginFormValues } from '../types/form'


export default function LoginFeature() {

  const toastId = 'login-request'
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const applySession = useAuthStore((state) => state.login)
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
      toast.success('Sesion iniciada', { id: toastId })
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(String(error), {
        id: toastId,
      })
    }
  }


  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [navigate, user])

  return (
    <LoginForm onSubmit={performLogin} />
  )
}
