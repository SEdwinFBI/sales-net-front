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
  /** Expiración del refresh token: el verdadero fin de la sesión. */
  refreshExpiresAt: number | null
  login: (session: AuthSession) => void
  logout: () => void
  setAccessToken: (access: string) => void
}

// El access token dura 8h en el backend (SIMPLE_JWT.ACCESS_TOKEN_LIFETIME).
const ACCESS_FALLBACK_MS = 8 * 60 * 60 * 1000

// Margen para el desfase de reloj cliente/servidor: renovamos 30s antes.
const CLOCK_SKEW_MS = 30_000

function decodeExpiry(token: string | null | undefined): number | null {
  if (!token) return null
  try {
    const decoded = jwtDecode<{ exp?: number }>(token)
    if (decoded.exp) return decoded.exp * 1000
  } catch {
    return null
  }
  return Date.now() + ACCESS_FALLBACK_MS
}

export function isTokenExpired(expiresAt: number | null): boolean {
  if (expiresAt === null) return false
  return Date.now() >= expiresAt - CLOCK_SKEW_MS
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      refreshExpiresAt: null,
      login: (session) => {
        const permissions = [session.user.role]
        // El backend manda full_name (snake_case); el front usa fullName.
        const rawUser = session.user as AuthUser & { full_name?: string }

        set({
          token: session.access,
          refreshToken: session.refresh,
          user: {
            ...rawUser,
            fullName: rawUser.fullName ?? rawUser.full_name ?? rawUser.username,
            permissions,
          },
          tokenExpiresAt: decodeExpiry(session.access),
          refreshExpiresAt: decodeExpiry(session.refresh),
        })
      },
      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
          tokenExpiresAt: null,
          refreshExpiresAt: null,
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
        refreshExpiresAt: state.refreshExpiresAt,
      }),
    },
  ),
)

/**
 * La sesión sigue viva mientras el REFRESH token no expire; si solo expiró
 * el access, el interceptor de axios lo renueva solo. Los guards de rutas
 * deben usar esto (no la expiración del access) para decidir si expulsar.
 */
export function isSessionExpired(state: Pick<AuthState, 'user' | 'token' | 'refreshExpiresAt'>): boolean {
  if (!state.user || !state.token) return true
  return isTokenExpired(state.refreshExpiresAt)
}

// Sincronización multi-tab: cuando otra pestaña rota los tokens (el refresh
// viejo queda invalidado en el server), esta pestaña recarga el estado desde
// localStorage para no usar tokens muertos.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'sales-net-auth') {
      void useAuthStore.persist.rehydrate()
    }
  })
}
