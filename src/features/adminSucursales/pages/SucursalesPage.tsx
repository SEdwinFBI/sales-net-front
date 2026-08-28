import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import { Card } from '@/components/ui/card'
import SucursalesTable from '../components/SucursalesTable'
import { useSucursales } from '../hooks/useSucursales'

export default function SucursalesPage() {
  const { data, isLoading } = useSucursales()

  return (
    <PageTemplateSimple
      title="Sucursales"
      description="Gestión de sucursales y de los usuarios con acceso a cada una."
    >
      <Card className="mt-4 p-3.5 sm:p-5">
        <SucursalesTable data={data} isLoading={isLoading} />
      </Card>
    </PageTemplateSimple>
  )
}
