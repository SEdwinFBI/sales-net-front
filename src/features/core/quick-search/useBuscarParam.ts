import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

/** Parámetro con el que la búsqueda rápida abre una pantalla ya filtrada. */
export const BUSCAR_PARAM = 'buscar'

/**
 * Aplica `?buscar=` de la URL al buscador de la pantalla, también si ya estaba abierta. Se aplica
 * una vez y se quita de la URL, para que una búsqueda nueva con el mismo texto vuelva a aplicarse.
 * `apply` recibe el texto y los parámetros (p. ej. fechas que acompañan a la búsqueda).
 */
export function useBuscarParam(apply: (texto: string, params: URLSearchParams) => void) {
  const [params, setParams] = useSearchParams()
  const buscar = params.get(BUSCAR_PARAM) ?? ''
  const [aplicado, setAplicado] = useState('')

  // Ajuste durante el render (patrón de React para reaccionar a un cambio de props/URL).
  if (buscar && buscar !== aplicado) {
    setAplicado(buscar)
    apply(buscar, params)
  } else if (!buscar && aplicado) {
    setAplicado('')
  }

  useEffect(() => {
    if (!buscar) return
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(BUSCAR_PARAM)
      return next
    }, { replace: true })
  }, [buscar, setParams])
}
