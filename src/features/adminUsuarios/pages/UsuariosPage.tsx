import PageTemplateSimple from '@/components/page-template/PageTemplateSimple'

export default function UsuariosPage() {
  return (
    <PageTemplateSimple
      title="Usuarios"
      description="Gestión de usuarios del sistema."
    >
      <div className="rounded-2xl border border-secondary/80 bg-secondary/20 p-4">
        <p className="text-sm font-semibold text-primary">Usuarios</p>
      </div>
    </PageTemplateSimple>
  )
}