import { useRef, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { appendPatternNode } from '../utils/pattern'

type PatternInputProps = {
  value: number[]
  onChange: (value: number[]) => void
  disabled?: boolean
  className?: string
}

export default function PatternInput({ value, onChange, disabled, className }: PatternInputProps) {
  const activePointer = useRef<number | null>(null)
  const current = useRef(value)

  const selectNode = (node: number) => {
    current.current = appendPatternNode(current.current, node)
    onChange(current.current)
  }

  const nodeAtPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width * 300
    const y = (event.clientY - bounds.top) / bounds.height * 300
    for (let node = 1; node <= 9; node++) {
      const cx = 50 + ((node - 1) % 3) * 100
      const cy = 50 + Math.floor((node - 1) / 3) * 100
      if (Math.hypot(x - cx, y - cy) <= 28) return node
    }
    return null
  }

  const stopDrawing = () => { activePointer.current = null }

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="Patrón de acceso de nueve puntos"
        aria-describedby="pattern-help"
        className={cn("relative mx-auto grid aspect-square w-full max-w-60 touch-none select-none grid-cols-3 rounded-2xl border border-border bg-muted/30", className)}
        onPointerDown={(event) => {
          if (disabled || !event.isPrimary || event.button !== 0) return
          const node = nodeAtPointer(event)
          if (node === null) return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          activePointer.current = event.pointerId
          current.current = []
          selectNode(node)
        }}
        onPointerMove={(event) => {
          if (disabled || activePointer.current !== event.pointerId) return
          const node = nodeAtPointer(event)
          if (node !== null) selectNode(node)
        }}
        onPointerUp={stopDrawing}
        onPointerCancel={() => {
          stopDrawing()
          current.current = []
          onChange([])
        }}
        onLostPointerCapture={stopDrawing}
      >
        <svg aria-hidden="true" viewBox="0 0 300 300" className="pointer-events-none absolute inset-0 size-full text-primary">
          <polyline
            points={value.map((node) => `${50 + ((node - 1) % 3) * 100},${50 + Math.floor((node - 1) / 3) * 100}`).join(' ')}
            fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        {Array.from({ length: 9 }, (_, index) => index + 1).map((node) => (
          <button
            key={node}
            type="button"
            disabled={disabled}
            aria-label={`Punto ${node}`}
            aria-pressed={value.includes(node)}
            className="relative flex items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            onClick={(event) => {
              if (event.detail !== 0 || disabled) return
              current.current = value
              selectNode(node)
            }}
          >
            <span className={`size-5 rounded-full border-2 transition-colors ${value.includes(node) ? 'border-primary bg-primary ring-4 ring-primary/15' : 'border-muted-foreground/40 bg-card'}`} />
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">{value.length} puntos seleccionados</p>
        <Button type="button" variant="ghost" size="sm" disabled={disabled || value.length === 0} onClick={() => { current.current = []; onChange([]) }}>Limpiar patrón</Button>
      </div>
    </div>
  )
}
