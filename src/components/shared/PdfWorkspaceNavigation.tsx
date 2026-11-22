import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { closePdfPreview, PDF_WORKSPACE_PATH, usePdfPreviewStore } from '@/lib/pdf-preview'

/** Abre la vista tras generar el reporte, también cuando lo solicita el agente. */
export default function PdfWorkspaceNavigation() {
  const pending = usePdfPreviewStore((state) => state.pendingNavigation)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!pending) return
    usePdfPreviewStore.setState({ pendingNavigation: false })
    if (location.pathname !== PDF_WORKSPACE_PATH) {
      navigate(PDF_WORKSPACE_PATH, {
        state: { from: location.pathname + location.search + location.hash },
      })
    }
  }, [pending, navigate, location.pathname, location.search, location.hash])

  // Al salir del área autenticada, no conservar documentos de la sesión.
  useEffect(() => () => closePdfPreview(), [])
  return null
}
