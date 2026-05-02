"use client"

import { useState, useRef, useEffect, type FC } from "react"
import { Search, X, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Customer = { id: string; name: string; phone: string }

type Props = {
    customers: Customer[]
    value: string
    onChange: (id: string) => void
}

const CustomerSelect: FC<Props> = ({ customers, value, onChange }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [highlighted, setHighlighted] = useState(0)

    const ref = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selected = customers.find((c) => c.id === value)

    const filtered = query
        ? customers.filter(
            (c) =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.phone.includes(query)
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
                    "flex items-center gap-2 rounded-2xl border px-4 py-3 bg-white",
                    open
                        ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        : "border-stone-200 hover:border-stone-300"
                )}
                onClick={toggle}
            >
                {/* Icon */}
                <Search className="size-5 text-stone-400 shrink-0" />

                {/* Input */}
                <input
                    ref={inputRef}
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder="Buscar cliente..."
                    value={open ? query : selected?.name ?? ""}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setHighlighted(0)
                    }}
                />

                {/* Clear */}
                {value && !open && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange("")
                        }}
                        className="text-stone-400 hover:text-stone-600"
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
                    className="text-stone-400"
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
                <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-white shadow-lg">
                    {filtered.length === 0 ? (
                        <div className="p-6 text-center text-sm text-stone-400">
                            Sin coincidencias
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
                                            {c.name
                                                .split(" ")
                                                .map((w) => w[0])
                                                .join("")
                                                .slice(0, 2)}
                                        </span>

                                        <div className="flex-1 text-sm">
                                            <div>{c.name}</div>
                                            <div className="text-xs text-stone-400">
                                                {c.phone}
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