import { afterEach, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

const logout = vi.fn()
vi.mock('@/features/core/store/auth-store', () => ({
  useAuthStore: { getState: () => ({ token: 'old-token', tokenExpiresAt: 1, refreshToken: 'old-refresh', logout }) },
  isTokenExpired: () => true,
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
import { api } from './api'

afterEach(() => vi.clearAllMocks())

it.each(['/auth/passkeys/login/opciones/', '/auth/passkeys/login/verificar/'])('no adjunta sesión ni reintenta una respuesta 401 del login público %s', async (url) => {
  const adapter = vi.fn(async (config) => {
    expect(config.headers.has('Authorization')).toBe(false)
    throw new AxiosError('Rejected', 'ERR_BAD_REQUEST', config, undefined, {
      data: { detail: 'Invalid challenge' }, status: 401, statusText: 'Unauthorized', headers: {}, config,
    })
  })
  await expect(api.post(url, {}, { adapter, headers: { Authorization: 'Bearer stale' } })).rejects.toThrow('Rejected')
  expect(adapter).toHaveBeenCalledTimes(1)
  expect(logout).not.toHaveBeenCalled()
})
