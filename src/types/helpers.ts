import type { KeyLike, MapInput, TypeValue } from '../components/common/DataTable'

export function toRecord<const T extends readonly { key: PropertyKey; label: string }[]>(arr: T) {
  return Object.fromEntries(arr.map((a) => [a.key, a.label])) as Record<T[number]['key'], string>
}

export function toTypeRecord<K extends KeyLike, V>(input: MapInput<K, V>): Record<K, TypeValue<V>> {
  if (Array.isArray(input)) {
    return input.reduce(
      (acc, { key, label, color }) => {
        ;(acc as any)[key] = { label, color }
        return acc
      },
      {} as Record<K, TypeValue<V>>
    )
  }

  // Es un Record
  const out: Record<K, TypeValue<V>> = {} as any
  for (const [k, v] of Object.entries(input) as [K, V | TypeValue<V>][]) {
    if (typeof v === 'object' && v !== null && 'label' in v) {
      out[k] = v as TypeValue<V>
    } else {
      out[k] = { label: v as V }
    }
  }
  return out
}
