import { Fingerprint, Info, LockKeyhole, UserRound } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/features/core/store/auth-store'
import PasskeyManager from '../components/PasskeyManager'

export default function PasskeysPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <PageTemplateSimple title="Passkeys" description="Configura el acceso a tu cuenta con huella, rostro o PIN.">
      <div className="mt-3 grid items-start gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary-complement/5 p-4 sm:p-5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Fingerprint aria-hidden="true" className="size-6" /></span>
            <div className="space-y-2">
              <h2 className="font-heading text-xl font-semibold">Tu acceso, con tu dispositivo</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">Usa huella, rostro o PIN para ingresar. Puedes agregar varias passkeys; algunas se sincronizan entre tus dispositivos.</p>
            </div>
            <div className="flex items-center gap-3 border-t border-primary/15 pt-4">
              <UserRound aria-hidden="true" className="size-5 shrink-0 text-primary" />
              <div className="min-w-0"><p className="truncate font-semibold">{user?.fullName || user?.username}</p><p className="text-xs text-muted-foreground">Configuración de tu cuenta</p></div>
            </div>
          </Card>
          <Card className="gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-2 font-semibold"><LockKeyhole aria-hidden="true" className="size-4 text-primary" /> Verificación de identidad</div>
            <p className="text-sm leading-relaxed text-muted-foreground">Te pediremos tu contraseña actual para agregar o revocar una passkey.</p>
            <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>En equipos compartidos, usa solo un perfil del sistema que tú controles. Quien pueda desbloquear la passkey podrá entrar a tu cuenta.</p>
            </div>
          </Card>
        </div>
        {user && <PasskeyManager key={user.id} userId={user.id} />}
      </div>
    </PageTemplateSimple>
  )
}
