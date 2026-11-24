import { Link } from 'react-router'
import { Bell, ChevronRight } from 'lucide-react'

import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/features/core/store/auth-store'
import { useQuickSearchPrefs } from '@/features/core/quick-search/quick-search-prefs'
import { useQuickSearchSources } from '@/features/core/quick-search/useQuickSearchSources'
import LlamarAdminSection from '../components/LlamarAdminSection'

const NO_USER = { id: 0, permissions: [] }

export default function ConfiguracionPage() {
  const user = useAuthStore((state) => state.user)
  const { disponibles, visibles } = useQuickSearchSources(user ?? NO_USER)
  const setVisible = useQuickSearchPrefs((state) => state.setVisible)
  const restablecer = useQuickSearchPrefs((state) => state.restablecer)

  if (!user) return null
  const esAdmin = user.permissions.includes('admin')
  const visiblesIds = new Set(visibles.map((source) => source.id))
  const hayOcultos = visibles.length < disponibles.length

  return (
    <PageTemplateSimple title="Configuración" description="Ajustes de tu cuenta.">
      <Card className="mt-3 gap-0 p-0">
        <section aria-labelledby="accesos-titulo" className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="accesos-titulo" className="text-sm font-semibold text-foreground">Accesos de búsqueda</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Botones del encabezado para buscar sin entrar al menú. Se guardan en este dispositivo.
              </p>
            </div>
            {hayOcultos && (
              <button
                type="button"
                onClick={() => restablecer(user.id)}
                className="shrink-0 cursor-pointer text-xs font-semibold text-primary hover:underline"
              >
                Mostrar todos
              </button>
            )}
          </div>

          <ul className="mt-3 divide-y divide-border/60">
            {disponibles.map((source) => {
              const controlId = `acceso-${source.id}`
              return (
                <li key={source.id} className="flex items-center gap-3 py-3">
                  <source.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <label htmlFor={controlId} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block text-sm font-medium text-foreground">{source.label}</span>
                    <span className="block text-xs text-muted-foreground">{source.descripcion}</span>
                  </label>
                  <Switch
                    id={controlId}
                    checked={visiblesIds.has(source.id)}
                    onCheckedChange={(checked) => setVisible(user.id, source.id, checked)}
                  />
                </li>
              )
            })}
          </ul>
        </section>

        {/* Solo vendedores con transmision de audio: si el admin no puede escucharlo, el aviso no sirve. */}
        {user.role === 'vendedor' && user.transmision_audio === true && <LlamarAdminSection />}

        {esAdmin && (
          <Link
            to="/administracion/notificaciones"
            className="flex items-center gap-3 border-t border-border/70 p-4 transition-colors hover:bg-accent/50 sm:px-5"
          >
            <Bell className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Notificaciones</span>
              <span className="block text-xs text-muted-foreground">Avisos de cobros y destinatarios.</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        )}
      </Card>
    </PageTemplateSimple>
  )
}
