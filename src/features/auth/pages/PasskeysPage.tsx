import { Fingerprint, UserRound } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { useAuthStore } from '@/features/core/store/auth-store'
import PasskeyManager from '../components/PasskeyManager'

export default function PasskeysPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <PageTemplateSimple title="Acceso con dispositivo" description="Administra el acceso a tu cuenta con huella, rostro o PIN.">
      <div className="mx-auto grid max-w-4xl gap-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Fingerprint aria-hidden="true" className="size-6" /></span>
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-semibold">Acceso con dispositivo</h1>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">Ingresa a tu cuenta con huella, rostro o el PIN de tu dispositivo.</p>
            </div>
          </div>
          <div className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <UserRound aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span className="truncate">{user?.fullName || user?.username}</span>
          </div>
        </header>
        {user && <PasskeyManager key={user.id} userId={user.id} />}
      </div>
    </PageTemplateSimple>
  )
}
