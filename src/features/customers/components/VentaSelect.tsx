"use client"
import { formatCurrency } from '../utils/venta-total'

import { useState, useRef, useEffect, type FC } from "react"
import { Search, X, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Venta } from "@/features/sales/types/sales"

type Props = {
  ventas: Venta[]
  value: number
  onChange: (id: number) => void
}

const VentaSelect: FC<Props> = ({ ventas = [], value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlighted, setHighlighted] = useState(0)

  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = ventas.find((v) => v.id === value)

  const filtered = query
    ? ventas.filter(
        (v) =>
          String(v.id).includes(query) ||
          (v.estado || '').toLowerCase().includes(query.toLowerCase()),
      )
    : ventas

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        setQuery("")
        setHighlighted(0)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      return next
    })
  }

  const select = (id: number) => {
    onChange(id)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-4 py-3 bg-card",
          open
            ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
            : "border-border hover:border-ring",
        )}
        onClick={toggle}
      >
        <Search className="size-5 text-muted-foreground shrink-0" />

        <input
          ref={inputRef}
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Buscar venta por ID o estado..."
          value={open ? query : selected ? `#${selected.id} — ${formatCurrency(selected.total)}` : ""}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
        />

        {value > 0 && !open && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange(0)
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          className="text-muted-foreground"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180 text-primary")}
          />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Sin coincidencias</div>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((v, i) => {
                const active = i === highlighted
                const isSelected = v.id === value

                return (
                  <li
                    key={v.id}
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      select(v.id)
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer",
                      active && "bg-primary/10",
                    )}
                  >
                    <span className="size-7 flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      #{v.id}
                    </span>

                    <div className="flex-1 text-sm">
                      <div className="font-medium">
                        {formatCurrency(v.total)} — {v.estado}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Abonado {formatCurrency(v.abonado)} | Saldo {formatCurrency(v.saldo)}
                      </div>
                    </div>

                    {isSelected && <Check className="size-4 text-primary" />}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default VentaSelect
