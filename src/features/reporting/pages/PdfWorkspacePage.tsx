import { useState } from 'react'
import { ArrowLeft, Check, Download, ExternalLink, FileText, LoaderCircle, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { PDF_WORKSPACE_PATH, previewPdf, usePdfPreviewStore, type PdfColumnSelection } from '@/lib/pdf-preview'

function Preview({ returnTo }: { returnTo: string }) {
  const document = usePdfPreviewStore((state) => state.document)!
  const { url, filename, title, columns = [], reload, activeSection = null, orientation = 'landscape' } = document
  const reportTitle = title || filename.replace(/\.pdf$/i, '').replace(/_/g, ' ')
  const initial = Object.fromEntries(columns.map((group) => [group.id, group.selected]))
  const [selection, setSelection] = useState<PdfColumnSelection>(initial)
  const [showColumns, setShowColumns] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeGroup = columns.find((group) => group.id === activeSection) ?? (columns.length === 1 ? columns[0] : undefined)
  const sectionTitle = activeGroup?.title || (activeGroup ? activeGroup.columns.map((column) => column.label).join(' · ') : 'Documento completo')
  const selected = activeGroup ? selection[activeGroup.id] ?? activeGroup.selected : []
  const dirty = !!activeGroup && JSON.stringify(selected) !== JSON.stringify(activeGroup.selected)
  const invalid = !!activeGroup && selected.length === 0
  const downloadName = activeGroup && columns.length > 1
    ? filename.replace(/\.pdf$/i, `_${sectionTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.pdf`)
    : filename

  async function updateDocument(section: string | null, apply = false) {
    if (!reload || busy || (apply && invalid)) return
    setBusy(true)
    setError('')
    // Cambiar de reporte conserva borradores; solo Aplicar guarda sus columnas.
    const applied = apply && activeGroup ? { ...initial, [activeGroup.id]: selected } : initial
    try {
      const result = await reload(applied, section, 'auto')
      if (usePdfPreviewStore.getState().document === document) {
        previewPdf(result.blob, filename, { title, columns: result.columns, activeSection: section, orientation: result.orientation, reload })
      }
    } catch {
      setError('No se pudo actualizar el reporte. Se conserva el documento anterior.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
          <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="Volver al listado" render={<Link to={returnTo} />}><ArrowLeft aria-hidden="true" /></Button>
          <h1 className="min-w-0 break-words pt-2 text-base font-semibold sm:truncate sm:pt-0 sm:text-xl" title={reportTitle}>{reportTitle}</h1>
        </div>
        <Button className="min-h-11 shrink-0" disabled={busy || dirty} aria-label={`Descargar ${sectionTitle} en PDF`} render={<a href={url} download={downloadName} />}>
          <Download aria-hidden="true" /><span className="hidden sm:inline">Descargar</span> PDF
        </Button>
      </header>

      {columns.length > 1 && (
        <nav aria-label="Reportes del documento" className="grid shrink-0 grid-cols-1 gap-2 pb-1 min-[400px]:grid-cols-2 sm:flex sm:overflow-x-auto">
          {columns.map((group) => {
            const hasDraft = JSON.stringify(selection[group.id] ?? group.selected) !== JSON.stringify(group.selected)
            return (
              <button key={group.id} type="button" disabled={busy} aria-pressed={activeSection === group.id}
                className={`flex min-h-11 min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:shrink-0 ${activeSection === group.id ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}
                onClick={() => { if (activeSection !== group.id) void updateDocument(group.id) }}>
                <FileText aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 break-words">{group.title || group.columns.map((column) => column.label).join(' · ')}</span>
                {hasDraft && <span className="size-2 shrink-0 rounded-full bg-primary" role="img" aria-label="Columnas sin aplicar" />}
              </button>
            )
          })}
          <button type="button" disabled={busy} aria-pressed={activeSection === null}
            className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:ml-auto sm:shrink-0 ${activeSection === null ? 'border-primary/50 bg-primary/10' : 'border-dashed border-border text-muted-foreground hover:bg-muted'}`}
            onClick={() => { if (activeSection !== null) void updateDocument(null) }}>Documento completo</button>
        </nav>
      )}

      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border lg:h-[clamp(28rem,68dvh,44rem)]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
          <div className="flex min-w-0 basis-full flex-wrap items-center gap-2 sm:basis-auto">
            <h2 className="min-w-0 break-words text-sm font-semibold">{sectionTitle}</h2>
            <span className="text-xs text-muted-foreground">Carta · {orientation === 'portrait' ? 'Vertical' : 'Horizontal'}</span>
            {dirty && <span className="text-xs text-primary" role="status">Columnas sin aplicar</span>}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {activeGroup && reload && (
              <Button size="sm" className="min-h-11 flex-1 sm:min-h-9 sm:flex-none" variant={showColumns ? 'secondary' : 'outline'} disabled={busy} aria-expanded={showColumns} aria-controls="report-columns"
                onClick={() => setShowColumns(!showColumns)}><SlidersHorizontal aria-hidden="true" /> Columnas <span className="text-xs tabular-nums">{selected.length}/{activeGroup.columns.length}</span></Button>
            )}
            <Button size="sm" className="min-h-11 flex-1 sm:min-h-9 sm:flex-none" variant="ghost" disabled={busy || dirty} aria-label={`Abrir ${sectionTitle} en otra pestaña`} render={<a href={url} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink aria-hidden="true" /><span className="sm:hidden">Abrir PDF</span><span className="hidden sm:inline">Imprimir</span>
            </Button>
          </div>
        </div>
        {error && <p role="alert" className="shrink-0 border-b bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {showColumns && activeGroup && reload && (
            <aside id="report-columns" aria-label={`Columnas de ${sectionTitle}`} className="flex max-h-[max(20rem,48dvh)] shrink-0 flex-col border-b bg-muted/10 lg:max-h-none lg:w-72 lg:border-r lg:border-b-0 xl:w-80">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                <h3 className="text-sm font-semibold">Columnas <span className="ml-1 text-xs font-normal tabular-nums text-muted-foreground">{selected.length}/{activeGroup.columns.length}</span></h3>
                <Button size="sm" className="min-h-11 sm:min-h-9" variant="ghost" disabled={busy || selected.length === activeGroup.columns.length}
                  onClick={() => setSelection({ ...selection, [activeGroup.id]: activeGroup.columns.map((column) => column.id) })}>Todas</Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
              <fieldset disabled={busy} className="grid grid-cols-2 gap-2">
                <legend className="sr-only">{sectionTitle}</legend>
                {activeGroup.columns.map((column) => (
                  <button key={column.id} type="button" aria-pressed={selected.includes(column.id)}
                    className={`flex min-h-11 min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${selected.includes(column.id) ? 'border-primary/40 bg-primary/10 hover:bg-primary/20' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    onClick={() => {
                      const chosen = new Set(selected)
                      if (chosen.has(column.id)) chosen.delete(column.id)
                      else chosen.add(column.id)
                      setSelection({ ...selection, [activeGroup.id]: activeGroup.columns.filter((item) => chosen.has(item.id)).map((item) => item.id) })
                    }}>
                    <span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded border ${selected.includes(column.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
                      {selected.includes(column.id) && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 break-words leading-snug">{column.label}</span>
                  </button>
                ))}
              </fieldset>
              </div>
               <div className="relative shrink-0 border-t bg-background p-3">
                 {invalid && <p role="alert" className="mb-2 text-xs text-destructive">Selecciona al menos una columna.</p>}
                 <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-2 lg:grid-cols-1">
                 <Button className="order-2 min-h-12 w-full px-2 text-sm lg:order-1 lg:min-h-11" disabled={!dirty || invalid || busy} onClick={() => void updateDocument(activeSection, true)}>
                   {busy && <LoaderCircle aria-hidden="true" className="animate-spin" />} Aplicar columnas
                 </Button>
                 <Button className="order-1 min-h-12 w-full border border-border px-2 lg:order-2 lg:min-h-9 lg:border-transparent" size="sm" variant="ghost" disabled={!dirty || busy}
                   onClick={() => setSelection({ ...selection, [activeGroup.id]: activeGroup.selected })}><RotateCcw aria-hidden="true" /> Deshacer</Button>
                 </div>
              </div>
            </aside>
          )}
          <section aria-label={`Vista previa de ${sectionTitle}`} aria-busy={busy} className="relative flex h-[clamp(20rem,60dvh,34rem)] min-w-0 shrink-0 bg-muted/20 sm:h-[clamp(25rem,62dvh,38rem)] lg:h-auto lg:min-h-0 lg:flex-1">
            <iframe src={`${url}#pagemode=none&view=FitH`} title={sectionTitle} className="min-h-0 w-full flex-1 border-0 bg-white" />
            {busy && <div className="absolute inset-0 flex items-center justify-center gap-3 bg-background/90" role="status"><LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" /> Preparando PDF…</div>}
          </section>
        </div>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground sm:hidden">Si el visor no carga, usa «Abrir PDF».</p>
      </div>
    </>
  )
}

export default function PdfWorkspacePage() {
  const document = usePdfPreviewStore((state) => state.document)
  const location = useLocation()
  const from: unknown = location.state?.from
  const returnTo = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from.split(/[?#]/)[0] !== PDF_WORKSPACE_PATH ? from : '/'
  if (!document) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
        <FileText aria-hidden="true" className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Selecciona un reporte para configurar</h1>
        <p className="text-sm text-muted-foreground">Vuelve al listado y pulsa «Configurar reporte» para generar el documento.</p>
        <Button render={<Link to={returnTo} />}><ArrowLeft aria-hidden="true" /> Volver al listado</Button>
      </section>
    )
  }
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-2 sm:p-3 lg:h-[calc(100dvh-8rem)] lg:min-h-[38rem]">
      <Preview key={document.filename} returnTo={returnTo} />
    </div>
  )
}
