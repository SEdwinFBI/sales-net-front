import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'

export default function ProductsCategories() {
  return (
    <PageTemplateSimple
      title="Categorías"
      description="Clasificación de productos por categoría."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Categorías</p>
      </div>
    </PageTemplateSimple>
  )
}
