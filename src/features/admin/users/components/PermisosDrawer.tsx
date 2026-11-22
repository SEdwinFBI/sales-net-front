import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Switch } from '@/components/ui/switch'

import { PERMISOS, type PermisoDef } from '../permisos'
import type { Usuario } from '../types/usuario-types'

type Props = {
  usuario: Usuario | null
  onClose: () => void
  onChange: (usuario: Usuario, permiso: PermisoDef, enabled: boolean) => void
  disabled: boolean
}

const GRUPOS = [...new Set(PERMISOS.map((permiso) => permiso.grupo))]

/** Permisos de un usuario en el teléfono: agrupados, cada uno con su explicación y su interruptor. */
export default function PermisosDrawer({ usuario, onClose, onChange, disabled }: Props) {
  return (
    <Drawer open={usuario !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {usuario && (
          <>
            <DrawerHeader className="px-4 pt-3 pb-3">
              <DrawerTitle className="text-base">Permisos de {usuario.fullName || usuario.username}</DrawerTitle>
              <DrawerDescription>Los cambios se guardan al instante.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="px-4 py-2">
              {GRUPOS.map((grupo) => (
                <section key={grupo} aria-label={grupo} className="py-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{grupo}</h3>
                  <ul className="divide-y divide-border/60">
                    {PERMISOS.filter((permiso) => permiso.grupo === grupo).map((permiso) => {
                      const bloqueo = permiso.bloqueo(usuario)
                      const controlId = `permiso-${usuario.id}-${permiso.key}`
                      return (
                        <li key={permiso.key} className="flex items-center gap-3 py-3">
                          <label htmlFor={controlId} className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground">{permiso.label}</span>
                            <span className="block text-xs text-muted-foreground">{bloqueo ?? permiso.descripcion}</span>
                          </label>
                          <Switch
                            id={controlId}
                            checked={permiso.valor(usuario)}
                            disabled={disabled || bloqueo !== null}
                            onCheckedChange={(checked) => onChange(usuario, permiso, checked)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
