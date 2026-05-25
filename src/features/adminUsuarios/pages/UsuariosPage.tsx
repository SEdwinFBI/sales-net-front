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
      <UsuariosTable data={data} isLoading={isLoading} />
    </PageTemplateSimple>
  )
}