import { formatDisplayDateTime } from '@/lib/dates'

type ValueFilter = {
  (row: { getValue: <T = unknown>(columnId: string) => T }, columnId: string, value: unknown): boolean
  autoRemove?: (value: unknown) => boolean
}

const normalize = (value: unknown) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')

export const textFilter: ValueFilter = (row, columnId, value) =>
  normalize(row.getValue(columnId)).includes(normalize(value))

export const idFilter: ValueFilter = (row, columnId, value) =>
  normalize(row.getValue(columnId)).includes(normalize(value))

export const amountFilter: ValueFilter = (row, columnId, value) => {
  const amount = row.getValue(columnId)
  const query = normalize(value).replace(/^q\s*/, '').replace(/,/g, '')
  return amount != null && query !== '' && Number.isFinite(Number(query))
    && Number(amount) === Number(query)
}

export const dateFilter: ValueFilter = (row, columnId, value) => {
  const date = row.getValue<string | null>(columnId)
  return date != null && normalize(`${date} ${formatDisplayDateTime(date)}`).includes(normalize(value))
}

for (const filter of [textFilter, idFilter, amountFilter, dateFilter]) {
  filter.autoRemove = (value) => normalize(value) === ''
}
