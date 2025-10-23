export function toRecord<const T extends readonly { key: PropertyKey; label: string }[]>(arr: T) {
  return Object.fromEntries(arr.map((a) => [a.key, a.label])) as Record<T[number]['key'], string>
}
