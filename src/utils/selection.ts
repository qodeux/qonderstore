// utils/selection.ts
import type { Selection } from '@heroui/react'

export const selectionToArray = (s: Selection): string[] => {
  if (s === 'all') return [] // para Listbox de múltiples, maneja a gusto
  return Array.from(s as Set<string>)
}
export const arrayToSelection = (arr: Array<string | number>): Selection => new Set(arr.map(String))
