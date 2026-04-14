import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'
import Sales from '@/features/sales/components'

export default function PosPage() {
  return (
    <PageTemplateSimple
      title="Punto de venta"
      description="Módulo de punto de venta de Sales Net."
    >
      <Sales />
    </PageTemplateSimple>
  )
}
