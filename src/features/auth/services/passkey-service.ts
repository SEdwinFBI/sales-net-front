import { api } from '@/lib/api'
import type { LoginResult } from '../types/auth'

export type Passkey = { id: number | string; nombre?: string }
type DescriptorJSON = Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string }
type CreationJSON = Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user' | 'excludeCredentials'> & {
  challenge: string
  user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string }
  excludeCredentials?: DescriptorJSON[]
}
type RequestJSON = Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'> & {
  challenge: string
  allowCredentials?: DescriptorJSON[]
}

export function supportsPasskeys(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext &&
    typeof PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
}

export function decodeBase64url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) => c.charCodeAt(0)).buffer
}

export function encodeBase64url(value: ArrayBuffer): string {
  let binary = ''
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function descriptor(value: DescriptorJSON): PublicKeyCredentialDescriptor {
  return { ...value, id: decodeBase64url(value.id) }
}

function serializeCredential(credential: Credential | null) {
  if (!credential || credential.type !== 'public-key') throw new Error('No se obtuvo una passkey. Vuelve a intentarlo.')
  const key = credential as PublicKeyCredential
  const response = key.response
  const common = { clientDataJSON: encodeBase64url(response.clientDataJSON) }
  let serializedResponse
  if ('attestationObject' in response) {
    const attestation = response as AuthenticatorAttestationResponse
    serializedResponse = {
      ...common,
      attestationObject: encodeBase64url(attestation.attestationObject),
      transports: attestation.getTransports?.() ?? [],
    }
  } else {
    const assertion = response as AuthenticatorAssertionResponse
    if (!assertion.userHandle?.byteLength) throw new Error('La passkey no identifica al usuario. Ingresa con contraseña y registra otra passkey.')
    serializedResponse = {
      ...common,
      authenticatorData: encodeBase64url(assertion.authenticatorData),
      signature: encodeBase64url(assertion.signature),
      userHandle: encodeBase64url(assertion.userHandle),
    }
  }
  return {
    id: key.id, rawId: encodeBase64url(key.rawId), type: key.type,
    authenticatorAttachment: key.authenticatorAttachment,
    clientExtensionResults: key.getClientExtensionResults(),
    response: serializedResponse,
  }
}

function requireSupport() {
  if (!supportsPasskeys()) throw new Error('Este navegador no permite passkeys aquí. Usa HTTPS o localhost y un navegador compatible.')
}

export async function registerPasskey(currentPassword: string, nombre: string): Promise<Passkey> {
  requireSupport()
  const { data } = await api.post<{ challenge_id: string; publicKey: CreationJSON }>('/auth/passkeys/registro/opciones/', {
    current_password: currentPassword, nombre: nombre.trim(),
  })
  const options = data.publicKey
  const credential = await navigator.credentials.create({ publicKey: {
    ...options, challenge: decodeBase64url(options.challenge),
    user: { ...options.user, id: decodeBase64url(options.user.id) },
    excludeCredentials: options.excludeCredentials?.map(descriptor),
  } })
  const result = await api.post<Passkey>('/auth/passkeys/registro/verificar/', {
    challenge_id: data.challenge_id, credential: serializeCredential(credential),
  })
  return result.data
}

export async function loginWithPasskey(): Promise<LoginResult> {
  requireSupport()
  const { data } = await api.post<{ challenge_id: string; publicKey: RequestJSON }>('/auth/passkeys/login/opciones/', {})
  const credential = await navigator.credentials.get({ publicKey: {
    ...data.publicKey, challenge: decodeBase64url(data.publicKey.challenge),
    allowCredentials: data.publicKey.allowCredentials?.map(descriptor),
  } })
  const result = await api.post<LoginResult>('/auth/passkeys/login/verificar/', {
    challenge_id: data.challenge_id, credential: serializeCredential(credential),
  })
  return result.data
}

export async function listPasskeys(): Promise<Passkey[]> {
  const { data } = await api.get<Passkey[]>('/auth/passkeys/')
  return data
}

export async function deletePasskey(id: Passkey['id'], currentPassword: string): Promise<void> {
  await api.delete(`/auth/passkeys/${encodeURIComponent(id)}/`, { data: { current_password: currentPassword } })
}
