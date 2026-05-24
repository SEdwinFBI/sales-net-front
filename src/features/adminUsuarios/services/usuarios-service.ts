import type {
  Usuario,
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
} from '../types/usuario-types'

let store: Usuario[] = []

const getStore = async (): Promise<Usuario[]> => {
  if (store.length === 0) {
    const { mockUsuarios } = await import('../mocks/usuarios')
    store = [...mockUsuarios]
  }
  return store
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  await new Promise((r) => setTimeout(r, 600))
  return getStore()
}

export const createUsuario = async (payload: CreateUsuarioPayload): Promise<Usuario> => {
  await new Promise((r) => setTimeout(r, 500))
  const list = await getStore()
  const nuevo: Usuario = {
    id: Date.now().toString(),
    fullName: payload.fullName,
    username: payload.username,
    role: payload.role,
  }
  store = [...list, nuevo]
  return nuevo
}

export const updateUsuario = async (payload: UpdateUsuarioPayload): Promise<Usuario> => {
  await new Promise((r) => setTimeout(r, 500))
  const list = await getStore()
  const updated: Usuario = {
    id: payload.id,
    fullName: payload.fullName,
    username: payload.username,
    role: payload.role,
  }
  store = list.map((u) => (u.id === payload.id ? updated : u))
  return updated
}

export const deleteUsuario = async (id: string): Promise<void> => {
  await new Promise((r) => setTimeout(r, 500))
  const list = await getStore()
  store = list.filter((u) => u.id !== id)
}