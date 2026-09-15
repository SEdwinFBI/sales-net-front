import { useEffect, useState } from 'react'

// Conserva el plazo al alternar entre acceso con contraseña y patrón.
const deadlines = new Map<string, { deadline: number; message: string; duration: number }>()

export function usePatternLoginLock(username: string) {
  const [locks, setLocks] = useState(() => new Map(deadlines))
  const [now, setNow] = useState(Date.now)
  const key = username.trim()
  const entry = locks.get(key)
  const deadline = entry?.deadline ?? 0
  const remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000))

  useEffect(() => {
    if (!deadline) return
    const timer = window.setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= deadline) window.clearInterval(timer)
    }, 250)
    return () => window.clearInterval(timer)
  }, [deadline])

  const lock = (seconds: number, message: string) => {
    const started = Date.now()
    deadlines.set(key, { deadline: started + seconds * 1000, message, duration: seconds })
    setLocks(new Map(deadlines))
    setNow(started)
  }

  return { remainingSeconds, message: entry?.message ?? '', duration: entry?.duration ?? 0, lock, isLocked: () => (deadlines.get(key)?.deadline ?? 0) > Date.now() }
}
