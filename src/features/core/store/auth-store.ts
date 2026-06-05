import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, User } from '@/features/auth/types/auth'
import { jwtDecode } from 'jwt-decode'

export type AuthUser = User

type AuthState = {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  tokenExpiresAt: number | null
  login: (session: AuthSession) => void
  logout: () => void
  setAccessToken: (access: string) => void
}

function computeExpiresAt(session: AuthSession): number | null {
  if (!session.access) return null
  try {
    const decode = jwtDecode<{ exp?: number }>(session.access)
    if (decode.exp) return decode.exp * 1000
  } catch {
    return null
  }
  return Date.now() + 60 * 60 * 1000
}

export function isTokenExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) return false
  return Date.now() >= expiresAt
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      login: (session) => {
        const permissions = session.user?.permissions?.length > 0
          ? session.user.permissions
          : [session.user.role]

        set({
          token: session.access,
          refreshToken: session.refresh,
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
          refreshToken: null,
          user: null,
          tokenExpiresAt: null,
        })
      },
      setAccessToken: (access) => set({ token: access }),
    }),
    {
      name: 'sales-net-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    },
  ),
)
