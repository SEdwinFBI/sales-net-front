import type { ComponentProps } from 'react'
import { Input } from './input'

type MoneyInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string | number
  onValueChange: (value: string) => void
}

/** Display thousands separators while keeping the form value free of commas. */
export function MoneyInput({ value, onValueChange, ...props }: MoneyInputProps) {
  const [integer, decimals] = String(value).split('.')
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    + (decimals === undefined ? '' : `.${decimals}`)

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatted}
      onChange={(event) => {
        const input = event.target
        const raw = input.value.replaceAll(',', '')
        if (!/^\d*(\.\d{0,2})?$/.test(raw)) return

        const position = input.selectionStart ?? input.value.length
        const digitsBeforeCursor = input.value.slice(0, position).replaceAll(',', '').length
        onValueChange(raw)

        // Preserve the cursor when separators are inserted or removed during editing.
        requestAnimationFrame(() => {
          let cursor = 0
          let characters = 0
          while (cursor < input.value.length && characters < digitsBeforeCursor) {
            if (input.value[cursor] !== ',') characters++
            cursor++
          }
          input.setSelectionRange(cursor, cursor)
        })
      }}
    />
  )
}
