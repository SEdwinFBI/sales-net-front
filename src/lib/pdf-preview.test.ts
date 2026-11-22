import { afterEach, describe, expect, it } from 'vitest'
import { closePdfPreview, previewPdf, usePdfPreviewStore } from './pdf-preview'

describe('vista previa PDF', () => {
  afterEach(closePdfPreview)

  it('conserva el PDF y su nombre sin necesitar APIs del navegador para descargar', async () => {
    previewPdf('%PDF-1.4 contenido', 'reporte.pdf')
    const document = usePdfPreviewStore.getState().document!
    expect(document.filename).toBe('reporte.pdf')
    expect(document.blob.type).toBe('application/pdf')
    expect(await document.blob.text()).toBe('%PDF-1.4 contenido')
  })

  it('reemplaza el documento anterior y permite cerrar sin descargar', () => {
    previewPdf('primero', 'primero.pdf')
    previewPdf('segundo', 'segundo.pdf')
    expect(usePdfPreviewStore.getState().document?.filename).toBe('segundo.pdf')
    closePdfPreview()
    expect(usePdfPreviewStore.getState().document).toBeNull()
    expect(usePdfPreviewStore.getState().pendingNavigation).toBe(false)
  })
})
