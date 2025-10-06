/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolbarCriteria } from '../components/common/ToolbarTable'

/**
 * Helper para aplicar los criterios en el padre.
 * - searchKeys: columnas donde buscar el texto
 * - criteria: { searchText, selected }
 */
export function applyToolbarFilters<T extends Record<string, any>>(
  rows: T[],
  searchKeys: (keyof T)[] | undefined,
  criteria: ToolbarCriteria<T>
) {
  const q = criteria.searchText?.trim().toLowerCase()

  return rows.filter((r) => {
    // 1) Búsqueda por texto
    if (searchKeys?.length && q) {
      const hit = searchKeys.some((k) => {
        const v = r[k as string]
        if (v == null) return false
        if (Array.isArray(v)) return v.some((x) => String(x).toLowerCase().includes(q))
        return String(v).toLowerCase().includes(q)
      })
      if (!hit) return false
    }

    // 2) Filtros por columna
    for (const [col, setVals] of Object.entries(criteria.selected ?? {})) {
      if (!setVals || setVals.size === 0) continue
      const v = (r as any)[col]
      if (Array.isArray(v)) {
        const anyMatch = v.some((x) => setVals.has(String(x)))
        if (!anyMatch) return false
      } else {
        if (!setVals.has(String(v))) return false
      }
    }

    return true
  })
}
