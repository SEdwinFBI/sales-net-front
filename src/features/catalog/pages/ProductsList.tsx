import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'

export default function ProductsList() {
  return (
    <PageTemplateSimple
      title="Productos"
      description="Listado de productos del catálogo."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Listado de productos</p>
      </div>
    </PageTemplateSimple>
  )
}
