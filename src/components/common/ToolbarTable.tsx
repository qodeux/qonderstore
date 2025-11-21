/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button, Input, Select, SelectItem, Tooltip } from '@heroui/react'
import { CopyCheck, CopyPlus, SquareMousePointer } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

export type SelectionBehavior = 'replace' | 'toggle'

type OptionLike = {
  key: string | number
  label: string
}

export type ToolbarButton = {
  label: string
  onPress: () => void
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  variant?: 'solid' | 'bordered' | 'flat' | 'light' | 'shadow' | 'ghost'
  isIconOnly?: boolean
  icon?: ReactNode
}

export type ToolbarFilter<T> = {
  label: string // Texto del filtro (ej. "Categoría")
  column: keyof T // Columna a filtrar (ej. "category")
  multiple?: boolean // true por defecto
  formatOption?: (v: unknown) => string // opcional: cómo mostrar cada opción
  optionsMap?: Record<string, string> | ReadonlyArray<OptionLike>
}

export type ToolbarCriteria<T> = {
  searchText: string
  // mapa columna -> conjunto de valores seleccionados (como strings)
  selected: Partial<Record<keyof T & string, Set<string>>>
}

type Props<T extends Record<string, any>> = {
  rows: T[]

  /** Búsqueda por texto: si se omite, no se muestra Input */
  searchFilter?: (keyof T)[]

  /** Filtros por columna: si se omite, no se muestra ningún Select */
  filters?: ToolbarFilter<T>[]

  /** Toggle de modo de selección en la tabla */
  enableToggleBehavior?: boolean
  selectionBehavior?: SelectionBehavior
  onToggleBehavior?: () => void

  /** Botones globales (derecha) */
  buttons?: ToolbarButton[]

  /** Notifica al padre cada vez que cambia el criterio */
  onCriteriaChange?: (criteria: ToolbarCriteria<T>) => void

  /** Contenido extra (izquierda), opcional */
  leftExtra?: ReactNode

  /** Clase extra, opcional */
  className?: string
}

// Helper interno para serializar valores a string
const toKey = (v: unknown) => (v == null ? '' : String(v))

const resolveLabel = <T extends Record<string, any>>(f: ToolbarFilter<T>, rawValue: unknown): string => {
  const v = toKey(rawValue)

  // 1) formatOption manda primero si existe
  if (f.formatOption) return f.formatOption(v)

  // 2) optionsMap como Record<string, string>
  if (f.optionsMap) {
    if (Array.isArray(f.optionsMap)) {
      // 2a) optionsMap como array [{ key, label }]
      const found = f.optionsMap.find((opt) => toKey(opt.key) === v)
      if (found) return found.label
    } else {
      // 2b) optionsMap como objeto { [key]: label }
      const label = f.optionsMap[v]
      if (label) return label
    }
  }

  // 3) fallback: el valor crudo
  return v
}

export function ToolbarTable<T extends Record<string, any>>(props: Props<T>) {
  const {
    rows,
    searchFilter,
    filters,
    enableToggleBehavior,
    selectionBehavior = 'replace',
    onToggleBehavior,
    buttons = [],
    onCriteriaChange,
    leftExtra,
    className
  } = props

  const [searchText, setSearchText] = useState('')
  // estado local de selección por filtro
  const [selected, setSelected] = useState<Partial<Record<string, Set<string>>>>({})
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('multiple')

  // Deriva opciones únicas por filtro a partir de las filas actuales
  const filterOptions = useMemo(() => {
    if (!filters?.length) return {}
    const result: Record<string, { value: string; label: string }[]> = {}
    for (const f of filters) {
      const set = new Set<string>()
      for (const r of rows) {
        const raw = r[f.column as string]
        // soporta arrays (por si una fila tiene múltiples valores en esa columna)
        if (Array.isArray(raw)) {
          raw.forEach((x) => set.add(toKey(x)))
        } else {
          set.add(toKey(raw))
        }
      }
      // quita vacío si no aporta
      set.delete('')

      const arr = Array.from(set).sort((a, b) => a.localeCompare(b))
      result[f.column as string] = arr.map((v) => ({
        value: v,
        label: resolveLabel(f, v)
      }))
    }
    return result
  }, [rows, filters])

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => (prev === 'multiple' ? 'single' : 'multiple'))
  }

  // Notifica criterios al padre
  useEffect(() => {
    onCriteriaChange?.({
      searchText,
      selected: Object.fromEntries(Object.entries(selected).map(([k, setVals]) => [k, new Set(setVals)])) as ToolbarCriteria<T>['selected']
    })
  }, [searchText, selected, onCriteriaChange])

  useEffect(() => {
    //Si cambiamos de multiple a single, limpiamos todas las selecciones excepto la primera de cada filtro
    if (selectionMode === 'single') {
      setSelected((prev) => {
        const newSelected: Partial<Record<string, Set<string>>> = {}
        for (const [key, setVals] of Object.entries(prev)) {
          if (setVals.size > 0) {
            const first = Array.from(setVals)[0]
            newSelected[key] = new Set([first])
          }
        }
        return newSelected
      })
    }
  }, [selectionMode])

  return (
    <div className={`flex justify-between items-center gap-4 ${className ?? ''}`}>
      {/* IZQUIERDA: búsqueda + filtros derivados + extras */}
      <section className='flex-grow flex items-center gap-2 '>
        {searchFilter?.length ? (
          <Input
            label='Buscar...'
            type='text'
            size='sm'
            variant='bordered'
            className='max-w-60'
            classNames={{ inputWrapper: 'bg-white' }}
            value={searchText}
            onClear={() => setSearchText('')}
            onValueChange={(v) => setSearchText(v ?? '')}
          />
        ) : null}

        {filters?.map((f) => {
          const key = f.column as string
          const options = filterOptions[key] ?? []
          // no muestres el filtro si no hay opciones
          if (!options.length) return null

          const current = selected[key] ?? new Set<string>()

          return (
            <Select
              key={key}
              className='max-w-60'
              label={f.label}
              selectionMode={f.multiple === false ? 'single' : selectionMode}
              isClearable
              size='sm'
              selectedKeys={current}
              variant='bordered'
              classNames={{ trigger: 'bg-white' }}
              onSelectionChange={(keys) => {
                // keys puede ser Set<Key> o string cuando es single
                const setVals = typeof keys === 'string' ? new Set([keys]) : new Set(Array.from(keys).map((k) => String(k)))

                setSelected((prev) => ({ ...prev, [key]: setVals }))
              }}
            >
              {options.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          )
        })}

        {filters && filters?.length > 0 && (
          <Tooltip content={selectionMode === 'multiple' ? 'Cambiar a selección simple' : 'Cambiar a selección multiple'} placement='right'>
            <Button isIconOnly variant='ghost' color='secondary' onPress={toggleSelectionMode}>
              {selectionMode === 'multiple' ? <SquareMousePointer className='w-5 h-5' /> : <CopyCheck className='w-5 h-5' />}
            </Button>
          </Tooltip>
        )}

        {leftExtra}
      </section>

      {/* DERECHA: toggle behavior + botones globales */}
      <section className='flex items-center gap-2'>
        {enableToggleBehavior && onToggleBehavior ? (
          <Button isIconOnly onPress={onToggleBehavior} aria-label='Toggle Selection Mode'>
            {selectionBehavior === 'replace' ? <CopyPlus className='w-5 h-5' /> : <SquareMousePointer className='w-5 h-5' />}
          </Button>
        ) : null}

        {buttons.map((b, i) => (
          <Button
            key={`${b.label}-${i}`}
            color={b.color ?? 'primary'}
            variant={b.variant ?? 'solid'}
            isIconOnly={b.isIconOnly}
            onPress={b.onPress}
          >
            {b.isIconOnly ? (
              b.icon
            ) : b.icon ? (
              <span className='inline-flex items-center gap-2'>
                {b.icon}
                {b.label}
              </span>
            ) : (
              b.label
            )}
          </Button>
        ))}
      </section>
    </div>
  )
}
