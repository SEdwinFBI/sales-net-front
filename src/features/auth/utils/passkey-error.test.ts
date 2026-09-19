import { describe, expect, it } from 'vitest'
import { getPasskeyErrorMessage } from './passkey-error'

describe('passkey attempt limit messages', () => {
  it.each([[300, '5 minutos'], [59, '1 minuto'], [61, '2 minutos']])('respects Retry-After %s', (seconds, text) => {
    const error = { isAxiosError: true, response: { status: 429, headers: { 'retry-after': String(seconds) } } }
    expect(getPasskeyErrorMessage(error)).toContain(text)
  })
  it('does not invent a delay when the server did not provide one', () => {
    expect(getPasskeyErrorMessage({ isAxiosError: true, response: { status: 429, headers: {} } })).toContain('más tarde')
  })
})
