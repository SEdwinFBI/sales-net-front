import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PasskeyErrorAlert from './PasskeyErrorAlert'

describe('alerta visible de límite de passkeys', () => {
  it('muestra el límite y el tiempo de espera recibido del servidor', () => {
    const error = { isAxiosError: true, response: { status: 429, headers: { 'retry-after': '120' } } }
    const html = renderToStaticMarkup(<PasskeyErrorAlert error={error} />)
    expect(html).toContain('role="alert"')
    expect(html).toContain('Límite de intentos alcanzado')
    expect(html).toContain('2 minutos')
  })

  it('muestra el límite sin inventar un plazo cuando no hay Retry-After', () => {
    const html = renderToStaticMarkup(<PasskeyErrorAlert error={{ isAxiosError: true, response: { status: 429, headers: {} } }} />)
    expect(html).toContain('Límite de intentos alcanzado')
    expect(html).toContain('más tarde')
    expect(html).not.toContain('1 minuto')
  })

  it('no confunde otro rechazo con el límite por minuto', () => {
    const html = renderToStaticMarkup(<PasskeyErrorAlert error={{ isAxiosError: true, response: { status: 400, data: { detail: 'Contraseña incorrecta' } } }} />)
    expect(html).toContain('Contraseña incorrecta')
    expect(html).not.toContain('Límite de intentos alcanzado')
  })

  it('no muestra una alerta cuando no hay error', () => {
    expect(renderToStaticMarkup(<PasskeyErrorAlert error={null} />)).toBe('')
  })
})
