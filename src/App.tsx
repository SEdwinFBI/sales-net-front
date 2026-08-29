import { RouterProvider } from 'react-router'
import { router } from '@/routes/routes'
import usePresenceSocket from './features/core/hooks/usePresenceSocket'
import { useAuthStore } from './features/core/store/auth-store'

export default function App() {
  const token = useAuthStore((state) => state.token)
  usePresenceSocket(token)
  return <RouterProvider router={router} />
}
