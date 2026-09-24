import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/features/core/store/auth-store'
import PatternSetupForm from '../components/PatternSetupForm'

export default function PatronAccesoPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <PageTemplateSimple title="Patrón de acceso" description="Configura un patrón personal para ingresar a tu cuenta.">
      <Card className="mt-4 p-3.5 sm:p-5">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="bg-muted/20 p-4 shadow-none sm:p-5">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck aria-hidden="true" className="size-6" /></span>
              <div className="space-y-2">
                <h2 className="font-heading text-xl font-semibold">Patrón de acceso</h2>
              </div>
              <div className="flex items-center gap-3 border-t border-border/70 pt-4">
                <UserRound aria-hidden="true" className="size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user?.fullName || user?.username}</p>
                </div>
              </div>
            </Card>
            <Card className="gap-3 bg-muted/20 p-4 shadow-none sm:p-5">
              <div className="flex items-center gap-2 font-semibold"><LockKeyhole aria-hidden="true" className="size-4 text-primary" /> Verificación de identidad</div>
              <p className="text-sm text-muted-foreground">Necesitarás tu contraseña actual.</p>
            </Card>
          </div>
          <PatternSetupForm key={user?.id} />
        </div>
      </Card>
    </PageTemplateSimple>
  )
}
