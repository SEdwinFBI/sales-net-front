import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { decodeBase64url, deletePasskey, encodeBase64url, listPasskeys, loginWithPasskey, registerPasskey, supportsPasskeys } from './passkey-service'

vi.mock('@/lib/api', () => ({ api: { post: vi.fn(), get: vi.fn(), delete: vi.fn() } }))
const get = vi.fn()
const create = vi.fn()
const bytes = new Uint8Array([251, 255]).buffer
const credential = {
  id: '-_8', rawId: bytes, type: 'public-key', authenticatorAttachment: 'platform',
  getClientExtensionResults: () => ({}),
  response: { clientDataJSON: bytes, authenticatorData: bytes, signature: bytes, userHandle: bytes },
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('window', { isSecureContext: true })
  vi.stubGlobal('PublicKeyCredential', class {})
  vi.stubGlobal('navigator', { credentials: { get, create } })
})
afterEach(() => vi.unstubAllGlobals())

describe('passkeys', () => {
  it('convierte binarios base64url sin padding', () => {
    expect(encodeBase64url(bytes)).toBe('-_8')
    expect(decodeBase64url('-_8')).toEqual(bytes)
  })

  it('requiere un contexto seguro y no inicia una ceremonia sin soporte', async () => {
    vi.stubGlobal('window', { isSecureContext: false })
    expect(supportsPasskeys()).toBe(false)
    await expect(loginWithPasskey()).rejects.toThrow('HTTPS')
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([
    { access: 'access', refresh: 'refresh', user: { id: 1 } },
    { requiere_seleccion_sucursal: true, pre_token: 'pre', sucursales: [{ id: 1, nombre: 'Central' }] },
  ])('serializa la autenticación y conserva el contrato de login', async (result) => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { challenge_id: 'challenge', publicKey: { challenge: '-_8', userVerification: 'required' } } }).mockResolvedValueOnce({ data: result })
    get.mockResolvedValue(credential)
    await expect(loginWithPasskey()).resolves.toEqual(result)
    expect(get).toHaveBeenCalledWith({ publicKey: { challenge: bytes, userVerification: 'required', allowCredentials: undefined } })
    expect(api.post).toHaveBeenLastCalledWith('/auth/passkeys/login/verificar/', {
      challenge_id: 'challenge', credential: {
        id: '-_8', rawId: '-_8', type: 'public-key', authenticatorAttachment: 'platform', clientExtensionResults: {},
        response: { clientDataJSON: '-_8', authenticatorData: '-_8', signature: '-_8', userHandle: '-_8' },
      },
    })
  })

  it('convierte usuario y exclusiones al registrar y envía los transports', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { challenge_id: 'register', publicKey: {
      challenge: '-_8', user: { id: '-_8', name: 'ana', displayName: 'Ana' }, rp: { name: 'SalesNet' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], excludeCredentials: [{ type: 'public-key', id: '-_8' }],
    } } }).mockResolvedValueOnce({ data: { id: 7, nombre: 'Laptop' } })
    create.mockResolvedValue({ ...credential, response: { clientDataJSON: bytes, attestationObject: bytes, getTransports: () => ['internal'] } })
    await expect(registerPasskey(' password ', ' Laptop ')).resolves.toEqual({ id: 7, nombre: 'Laptop' })
    expect(api.post).toHaveBeenNthCalledWith(1, '/auth/passkeys/registro/opciones/', { current_password: ' password ', nombre: 'Laptop' })
    expect(create.mock.calls[0][0].publicKey.user.id).toEqual(bytes)
    expect(create.mock.calls[0][0].publicKey.excludeCredentials[0].id).toEqual(bytes)
    expect(api.post).toHaveBeenLastCalledWith('/auth/passkeys/registro/verificar/', expect.objectContaining({
      challenge_id: 'register', credential: expect.objectContaining({ response: { clientDataJSON: '-_8', attestationObject: '-_8', transports: ['internal'] } }),
    }))
  })

  it('obtiene un desafío nuevo después de cancelar y nunca verifica la cancelación', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { challenge_id: 'new', publicKey: { challenge: '-_8' } } })
    get.mockRejectedValue(new DOMException('Cancelled', 'NotAllowedError'))
    await expect(loginWithPasskey()).rejects.toThrow('Cancelled')
    await expect(loginWithPasskey()).rejects.toThrow('Cancelled')
    expect(vi.mocked(api.post).mock.calls.map(([url]) => url)).toEqual(['/auth/passkeys/login/opciones/', '/auth/passkeys/login/opciones/'])
  })

  it('rechaza credenciales sin userHandle antes de verificar', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { challenge_id: 'new', publicKey: { challenge: '-_8' } } })
    get.mockResolvedValue({ ...credential, response: { ...credential.response, userHandle: null } })
    await expect(loginWithPasskey()).rejects.toThrow('no identifica')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('lista credenciales y envía la contraseña en el cuerpo de DELETE', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 7, nombre: 'Laptop' }] })
    await expect(listPasskeys()).resolves.toEqual([{ id: 7, nombre: 'Laptop' }])
    await deletePasskey(7, ' password ')
    expect(api.delete).toHaveBeenCalledWith('/auth/passkeys/7/', { data: { current_password: ' password ' } })
  })
})
