import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from '@/routes/routes'
import usePresenceSocket from './features/core/hooks/usePresenceSocket'
import { useAuthStore } from './features/core/store/auth-store'
import { useThemeStore } from './features/core/store/theme-store'

export default function App() {
  const token = useAuthStore((state) => state.token)
  const theme = useThemeStore((state) => state.theme)
  usePresenceSocket(token)

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        theme={theme}
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'rounded-2xl! border-border/80! shadow-lg!',
          },
        }}
      />
    </>
  )
}
