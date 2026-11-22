import { api } from '@/lib/api'
import { previewPdf, usePdfPreviewStore, type PdfColumnGroup, type PdfColumnSelection, type PdfOrientation } from '@/lib/pdf-preview'

interface ReportRequest {
  method?: 'get' | 'post'
  params?: Record<string, unknown>
  data?: Record<string, unknown>
}

/** Reutiliza exactamente los filtros/IDs originales al cambiar columnas. */
export async function previewReport(url: string, filename: string, options: ReportRequest = {}) {
  async function fetchDocument(selection?: PdfColumnSelection, section?: string | null, orientation?: PdfOrientation | 'auto') {
    const configuration = section != null || orientation ? { tables: selection ?? {}, section: section ?? null, ...(orientation ? { orientation } : {}) } : selection
    const columns = configuration ? { columns: JSON.stringify(configuration) } : {}
    const response = await api.request<Blob>({
      url,
      method: options.method ?? 'get',
      params: { ...options.params, ...(options.method !== 'post' ? columns : {}) },
      data: options.method === 'post' ? { ...options.data, ...(configuration ? { columns: configuration } : {}) } : undefined,
      responseType: 'blob',
    })
    const header = response.headers?.['x-pdf-columns']
    const groups: PdfColumnGroup[] = typeof header === 'string' ? JSON.parse(header) : []
    const titleHeader = response.headers?.['x-pdf-title']
    const title: string | undefined = typeof titleHeader === 'string' ? JSON.parse(titleHeader) : undefined
    const orientationHeader = response.headers?.['x-pdf-orientation']
    const actualOrientation: PdfOrientation = orientationHeader === 'portrait' ? 'portrait' : 'landscape'
    return { blob: response.data, columns: groups, title, orientation: actualOrientation }
  }
  const document = await fetchDocument()
  const firstSection = document.columns.length > 1 ? document.columns[0].id : null
  const firstDocument = firstSection ? await fetchDocument(undefined, firstSection) : document
  previewPdf(firstDocument.blob, filename, { columns: firstDocument.columns, title: document.title, orientation: firstDocument.orientation, activeSection: firstSection, reload: fetchDocument })
  usePdfPreviewStore.setState({ pendingNavigation: true })
}
