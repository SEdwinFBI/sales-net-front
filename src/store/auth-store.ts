import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession } from '@/features/auth/types/auth'

export type AppRole = 'admin' | 'vendedor'

/**
 * AuthUser representa al usuario logueado.

 */
export type AuthUser = {
  name: string
  initials: string
  role: AppRole
  permissions: AppRole[]
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  tokenExpiresAt: number | null
  login: (session: AuthSession) => void
  logout: () => void
}

function buildAuthUser(session: AuthSession): AuthUser {
  const normalizedUsername = session.username.trim()
  const usernameParts = normalizedUsername.split(/\s+/).filter(Boolean)
  const initials =
    usernameParts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || normalizedUsername.slice(0, 2).toUpperCase() || 'SN'

  return {
    name: normalizedUsername,
    initials,
    role: session.role,
    permissions: session.permissions ?? [session.role],
  }
}

/**
 * Calcula cuándo expira el token.

 */
function computeExpiresAt(session: AuthSession): number | null {
  if (!session.expiresIn) return null
  return Date.now() + session.expiresIn
}

/** Verifica si el token está expirado. */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) return false
  return Date.now() >= expiresAt
}

function syncTokenStorage(token: string | null) {
  if (typeof window === 'undefined') return

  if (token) {
    window.localStorage.setItem('token', token)
  } else {
    window.localStorage.removeItem('token')
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      login: (session) => {
        syncTokenStorage(session.token)
        set({
          token: session.token,
          user: buildAuthUser(session),
          tokenExpiresAt: computeExpiresAt(session),
        })
      },
      logout: () => {
        syncTokenStorage(null)
        set({
          token: null,
          user: null,
          tokenExpiresAt: null,
        })
      },
    }),
    {
      name: 'sales-net-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    },
  ),
)
