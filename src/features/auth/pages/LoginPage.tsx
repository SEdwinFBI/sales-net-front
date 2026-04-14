import PageMeta from '@/components/page-template/PageMeta'
import LoginFeature from '@/features/auth'
import LoginLayout from '@/layouts/login/LoginLayout'

export default function LoginPage() {
  return (
    <LoginLayout>
      <PageMeta
        title="Login"
        description="Acceso Sales Net."
      />
      <LoginFeature />
    </LoginLayout>
  )
}
