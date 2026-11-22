import { create } from 'zustand'

export interface PdfColumnGroup {
  id: string
  title?: string
  columns: { id: string; label: string }[]
  selected: string[]
}
export type PdfColumnSelection = Record<string, string[]>
export type PdfOrientation = 'landscape' | 'portrait'
export interface PdfPreviewOptions {
  title?: string
  orientation?: PdfOrientation
  activeSection?: string | null
  orientations?: Record<string, PdfOrientation>
  columns?: PdfColumnGroup[]
  reload?: (selection: PdfColumnSelection, section?: string | null, orientation?: PdfOrientation | 'auto') => Promise<{ blob: Blob; columns: PdfColumnGroup[]; orientation?: PdfOrientation }>
}
interface PdfPreviewState {
  document: ({ blob: Blob; filename: string; url: string } & PdfPreviewOptions) | null
  pendingNavigation: boolean
}

export const PDF_WORKSPACE_PATH = '/reportes/configurar-pdf'
export const usePdfPreviewStore = create<PdfPreviewState>(() => ({ document: null, pendingNavigation: false }))

/** Conserva el documento generado; no descarga hasta que el usuario lo elija. */
export function previewPdf(data: BlobPart, filename: string, options: PdfPreviewOptions = {}) {
  const blob = new Blob([data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  closePdfPreview()
  usePdfPreviewStore.setState({
    document: { blob, filename, url, ...options },
  })
}

export function closePdfPreview() {
  const document = usePdfPreviewStore.getState().document
  if (document) URL.revokeObjectURL(document.url)
  usePdfPreviewStore.setState({ document: null, pendingNavigation: false })
}
