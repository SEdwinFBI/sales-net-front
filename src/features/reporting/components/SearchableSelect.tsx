import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

type Option = { id?: number; label: string }

type Props = {
  value: string | number | undefined
  onChange: (value: string | undefined) => void
  options: Option[]
  placeholder: string
  className?: string
}

export default function SearchableSelect({ value, onChange, options, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const selectedLabel = options.find(
    (o) => (o.id !== undefined ? String(o.id) : o.label) === String(value ?? '')
  )?.label

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const handleSelect = (opt: Option) => {
    onChange(opt.id !== undefined ? String(opt.id) : opt.label)
    setSearch('')
    setOpen(false)
  }

  const handleClear = useCallback(() => {
    onChange(undefined)
    setSearch('')
  }, [onChange])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ''}`}
      role="combobox"
      aria-controls={listboxId}
      aria-expanded={open}
      aria-haspopup="listbox"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false)
          setSearch('')
        }
      }}
    >
      <div className="relative">
        {value ? (
          <>
            <Input
              value={selectedLabel ?? ''}
              readOnly
              aria-autocomplete="list"
              className="cursor-pointer pr-14 text-xs"
              onFocus={() => setOpen(true)}
            />
            <button
              type="button"
              aria-label="Limpiar seleccion"
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <Input
            value={open ? search : ''}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            aria-autocomplete="list"
            placeholder={placeholder}
            className="pr-8 text-xs"
          />
        )}
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      </div>
      {open && (
        <div id={listboxId} role="listbox" className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
          ) : (
            filtered.map((opt, i) => {
              const val = opt.id !== undefined ? String(opt.id) : opt.label
              const isSelected = String(value ?? '') === val
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  key={i}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors ${isSelected ? 'bg-primary/10 font-medium' : ''}`}
                >
                  {opt.label}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
