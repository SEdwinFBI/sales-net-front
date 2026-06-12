import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, User } from '@/features/auth/types/auth'
import { jwtDecode } from 'jwt-decode'




export type AuthUser = User

type AuthState = {
  user: AuthUser | null
  token: string | null
  tokenExpiresAt: number | null
  login: (session: AuthSession) => void
  logout: () => void
}


/**
 * Calcula cuándo expira el token.

 */
function computeExpiresAt(session: AuthSession): number | null {
  if (!session.access) return null
  try {
    const decode = jwtDecode<{ exp?: number }>(session.access)
    if (decode.exp) {
      return decode.exp * 1000
    }
  } catch {
    return null
  }

  return Date.now() + 60 * 60 * 1000
}

/** Verifica si el token está expirado. */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) return false
  return Date.now() >= expiresAt
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      login: (session) => {
        const permissions = session.user.permissions.length > 0
          ? session.user.permissions
          : [session.user.role]

        set({
          token: session.access,
          user: {
            ...session.user,
            permissions,
          },
          tokenExpiresAt: computeExpiresAt(session),
        })
      },
      logout: () => {
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
