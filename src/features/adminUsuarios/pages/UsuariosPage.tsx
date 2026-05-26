import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import UsuariosTable from '../components/UsuariosTable'
import { useUsuarios } from '../hooks/useUsuarios'

export default function UsuariosPage() {
  const { data, isLoading } = useUsuarios()

  return (
    <PageTemplateSimple
      title="Usuarios"
      description="Gestión de usuarios del sistema."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Usuarios</p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <UsuariosTable data={data} isLoading={isLoading} />
      </div>
    </PageTemplateSimple>
  )
}
