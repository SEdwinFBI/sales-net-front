import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import UsuariosTable from '../components/UsuariosTable'
import { useUsuarios } from '../hooks/useUsuarios'
import useAdminPresence from '@/features/core/hooks/useAdminPresence';
import { useAuthStore } from '@/features/core/store/auth-store';
import { cn } from '@/lib/utils'

export default function UsuariosPage() {
  const { data, isLoading } = useUsuarios()
  const adminToken = useAuthStore((state) => state.token);
  const online = useAdminPresence(adminToken);
  const hasOnline = online.size > 0

  return (
    <PageTemplateSimple
      title="Usuarios"
      description="Gestión de usuarios del sistema."
    >
      <Card className="mt-4 space-y-3 p-3.5 sm:p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2">
            {hasOnline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={cn('relative inline-flex size-2 rounded-full', hasOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
          </span>
          <span>
            <strong className="font-semibold text-foreground">{online.size}</strong>{' '}
            {online.size === 1 ? 'usuario conectado ahora' : 'usuarios conectados ahora'}
          </span>
        </div>

        <UsuariosTable data={data} isLoading={isLoading} online={online} />
      </Card>
    </PageTemplateSimple>
  )
}
