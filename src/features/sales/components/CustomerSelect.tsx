"use client"

import { useState, useRef, useEffect, type FC } from "react"
import { Search, X, ChevronDown, Check, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/helpers/money"
import type { Customer } from '@/features/customers/hooks/useCustomers'
import TipoClienteBadge from '@/features/customers/components/TipoClienteBadge'

type Props = {
    customers: Customer[]
    value: string
    onChange: (id: string) => void
    onSearch?: (query: string) => void
    loading?: boolean
    onQuickCreate?: () => void
}

const CustomerSelect: FC<Props> = ({ customers, value, onChange, onSearch, loading, onQuickCreate }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [highlighted, setHighlighted] = useState(0)

    const ref = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selected = customers.find((c) => c.id === value)

    const filtered = query
        ? customers.filter(
            (c) =>
                (c.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
                (c.phone ?? '').includes(query)
        )
        : customers

    // cerrar al hacer click fuera
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

    const select = (id: string) => {
        onChange(id)
        setOpen(false)
        setQuery("")
    }

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <div
                className={cn(
                    "flex items-center gap-2 rounded-2xl border px-4 py-3 bg-card",
                    open
                        ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        : "border-border hover:border-ring"
                )}
                onClick={toggle}
            >
                {/* Icon */}
                <Search className="size-5 text-muted-foreground shrink-0" />

                {/* Input */}
                <input
                    ref={inputRef}
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder="Buscar cliente..."
                    value={open ? query : selected?.name ?? ""}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        onSearch?.(e.target.value)
                        setHighlighted(0)
                    }}
                />

                {selected?.tipo_cliente === 'SOLO_PRECIOS' && !open && <TipoClienteBadge tipo={selected.tipo_cliente} />}

                {/* Clear */}
                {value && !open && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange("")
                        }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}

                {/* Arrow toggle */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        toggle()
                    }}
                    className="text-muted-foreground"
                >
                    <ChevronDown
                        className={cn(
                            "size-4 transition-transform",
                            open && "rotate-180 text-primary"
                        )}
                    />
                </button>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-card shadow-lg overflow-hidden">
                    {onQuickCreate && (
                        <div className="border-b border-border/60 p-2 bg-muted/20">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    setOpen(false)
                                    onQuickCreate()
                                }}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                                <UserPlus className="size-3.5" />
                                Nuevo cliente
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Cargando clientes...
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No hay clientes disponibles
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-5 text-center text-sm text-muted-foreground space-y-2">
                            <p>Sin coincidencias para &quot;{query}&quot;</p>
                            {onQuickCreate && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        setOpen(false)
                                        onQuickCreate()
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-colors cursor-pointer"
                                >
                                    <UserPlus className="size-3.5" />
                                    Crear este cliente
                                </button>
                            )}
                        </div>
                    ) : (
                        <ul className="max-h-56 overflow-y-auto py-1">
                            {filtered.map((c, i) => {
                                const active = i === highlighted
                                const isSelected = c.id === value

                                return (
                                    <li
                                        key={c.id}
                                        onMouseEnter={() => setHighlighted(i)}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            select(c.id)
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 cursor-pointer",
                                            active && "bg-primary/10"
                                        )}
                                    >
                                        <span className="size-7 flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                            {(c.name ?? '')
                                                .split(" ")
                                                .map((w) => w[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase() || '?'}
                                        </span>

                                        <div className="flex-1 text-sm min-w-0">
                                            <div className="truncate">{c.name ?? 'Sin nombre'}</div>
                                            <TipoClienteBadge tipo={c.tipo_cliente} />
                                            <div className="text-xs text-muted-foreground truncate">
                                                {c.phone ?? 'Sin teléfono'}{c.tipo_cliente !== 'SOLO_PRECIOS' && <> · Saldo: {formatCurrency(c.balance ?? 0)}</>}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <Check className="size-4 text-primary" />
                                        )}
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

export default CustomerSelect
