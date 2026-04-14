import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import LoginForm from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/store/auth-store'
import { useLoginMutation } from './hooks/useLoginMutation'
import type { LoginFormValues } from './types/form'


export default function LoginFeature() {

  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const applySession = useAuthStore((state) => state.login)
  const { mutateAsync: login, isPending } = useLoginMutation()


  useEffect(() => {
    if (!user) {
      return
    }

    navigate("/", { replace: true })
  }, [navigate, user])

  const handleSubmit = async (values: LoginFormValues) => {
    if (isPending) {
      return
    }

    const toastId = 'login-request'

    try {
      toast.loading('Validando credenciales...', { id: toastId })

      const session = await login({
        username: values.username.trim(),
        password: values.role,
      })

      applySession(session)
      toast.success(`Sesion iniciada como ${session.role}`, { id: toastId })
      navigate("/", { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesion', {
        id: toastId,
      })
    }
  }

  return <LoginForm onSubmit={handleSubmit} />
}
