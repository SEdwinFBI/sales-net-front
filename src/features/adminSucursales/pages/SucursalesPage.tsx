import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import SucursalesTable from '../components/SucursalesTable'
import { useSucursales } from '../hooks/useSucursales'

export default function SucursalesPage() {
  const { data, isLoading } = useSucursales()

  return (
    <PageTemplateSimple
      title="Sucursales"
      description="Gestión de sucursales y de los usuarios con acceso a cada una."
    >
      <div className="mt-4">
        <SucursalesTable data={data} isLoading={isLoading} />
      </div>
    </PageTemplateSimple>
  )
}
