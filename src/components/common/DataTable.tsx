/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type Selection,
  type SortDescriptor
} from '@heroui/react'
import { EllipsisVertical, Star } from 'lucide-react'
import type { Key, ReactElement } from 'react'
import { useCallback, useMemo, useRef } from 'react'
import { Controller } from 'react-hook-form'
import { entityRegistry, type EntityAdapter, type EntityKind, type MenuAction } from '../../services/entityRegistry'
import { formatDate, formatRelativeTime, toDate } from '../../utils/date'

export type PresetKey = 'is_active' | 'featured' | 'actions' | 'input' | 'date' | 'money'

export type FormatPreset = 'full' | 'short' | 'time' | 'date' | 'relative'
export type AlignPreset = 'start' | 'center' | 'end'
export type InputConfig = {
  width?: string
  type?: 'text' | 'number' | 'date' | 'money'
  preffix?: string
  suffix?: string
}

export type DateConfig = {
  format?: FormatPreset
  type?: 'absolute' | 'relative'
  dateFormatter?: (date: Date) => string
  locale?: string
  timeZone?: string
}

export type ColumnDef<T> = {
  key: keyof T | string
  label: string
  allowsSorting?: boolean
  preset?: PresetKey
  presetConfig?: InputConfig | DateConfig
  render?: (row: T) => React.ReactNode
  sortAccessor?: (row: T) => string | number
  align?: AlignPreset
}

type Props<T> = {
  columns: ColumnDef<T>[]
  rows: T[]
  selectedKeys: Selection
  onSelectionChange: (s: Selection) => void
  selectionMode?: 'multiple' | 'single' | 'none'
  selectionBehavior?: 'replace' | 'toggle'
  sortDescriptor: SortDescriptor
  onSortChange: (descriptor: SortDescriptor) => void
  bottomContent?: React.ReactNode
  getRowKey?: (row: T) => Key
  onRowActivate?: (row: T) => void | Promise<void>
  maxHeight?: number | undefined
  disallowEmptySelection?: boolean

  /** modo recomendado: la tabla resuelve todo via registry */
  entity: EntityKind

  /** overrides puntuales (abrir modal, confirm delete, afterChange, acciones extra, etc.) */
  adapterOverrides?: Partial<EntityAdapter<T>>

  /** opcional: pasar adapter completo (casi nunca necesario) */
  resource?: EntityAdapter<T>
}

const DefaultFooter = ({ selectionCount, totalRows }: { selectionCount: number; totalRows: number }) => (
  <section className='flex justify-between items-center m-4 mb-0 text-sm text-default-500'>
    <div>
      <span>
        Mostrando {totalRows} {totalRows > 1 ? 'resultados' : 'resultado'}{' '}
      </span>
      {selectionCount > 1 ? <>| {selectionCount} seleccionados</> : null}
    </div>
    {/* <div>Filtros</div> */}
  </section>
)

export function DataTable<T extends Record<string, any>>(p: Props<T>) {
  const {
    columns,
    rows,
    selectedKeys,
    onSelectionChange,
    selectionMode = 'multiple',
    selectionBehavior = 'replace',
    sortDescriptor,
    maxHeight = undefined,
    disallowEmptySelection = false,
    onSortChange,
    bottomContent = (
      <DefaultFooter totalRows={rows.length} selectionCount={selectedKeys === 'all' ? rows.length : (selectedKeys as Set<Key>).size} />
    ),
    getRowKey = (row) => (row as any).key as Key,
    entity,
    adapterOverrides,
    resource
  } = p

  /** adapter final = registry(entity) + resource (si lo pasas) + overrides */
  const adapter: EntityAdapter<T> = useMemo(() => {
    const base = entityRegistry[entity] as EntityAdapter<T>
    return { ...(base || {}), ...(resource || {}), ...(adapterOverrides || {}) }
  }, [entity, resource, adapterOverrides])

  const sortedItems = useMemo(() => {
    const dir = sortDescriptor.direction === 'descending' ? -1 : 1

    return [...rows].sort((a, b) => {
      const colKey = sortDescriptor.column as string | undefined
      if (!colKey) return 0

      const col = columns.find((c) => String(c.key) === colKey)
      const va = col?.sortAccessor ? col.sortAccessor(a) : (a as any)[colKey]
      const vb = col?.sortAccessor ? col.sortAccessor(b) : (b as any)[colKey]

      // 1) Si es fecha, comparar por timestamp, con nulos al final (asc)
      if (col?.preset === 'date') {
        const ta = toDate(va)?.getTime()
        const tb = toDate(vb)?.getTime()
        const nilA = ta == null || Number.isNaN(ta)
        const nilB = tb == null || Number.isNaN(tb)

        if (nilA || nilB) {
          if (nilA && nilB) {
            // tie-breaker
            const kA = String(getRowKey(a))
            const kB = String(getRowKey(b))
            return kA < kB ? -1 : kA > kB ? 1 : 0
          }
          const nullsLastAsc = nilA ? 1 : -1 // asc: nulos al final
          return dir * nullsLastAsc
        }

        const cmpNum = (ta as number) - (tb as number)
        let cmp = cmpNum < 0 ? -1 : cmpNum > 0 ? 1 : 0
        if (cmp === 0) {
          const kA = String(getRowKey(a))
          const kB = String(getRowKey(b))
          cmp = kA < kB ? -1 : kA > kB ? 1 : 0
        }
        return dir * cmp
      }

      // 2) General (strings/números) con manejo de nulos y tie-breaker
      const nilA = va == null || va === ''
      const nilB = vb == null || vb === ''

      if (nilA || nilB) {
        if (nilA && nilB) {
          const kA = String(getRowKey(a))
          const kB = String(getRowKey(b))
          // tie-breaker independiente del dir para estabilidad
          return kA < kB ? -1 : kA > kB ? 1 : 0
        }
        const nullsLastAsc = nilA ? 1 : -1 // asc: nulos al final
        return dir * nullsLastAsc
      }

      const A = typeof va === 'string' ? (va as string).toLowerCase() : va
      const B = typeof vb === 'string' ? (vb as string).toLowerCase() : vb

      let cmp: number
      if (typeof A === 'number' && typeof B === 'number') {
        const aNum = Number.isNaN(A) ? -Infinity : (A as number)
        const bNum = Number.isNaN(B) ? -Infinity : (B as number)
        cmp = aNum < bNum ? -1 : aNum > bNum ? 1 : 0
      } else if (typeof A === 'string' && typeof B === 'string') {
        cmp = A.localeCompare(B)
      } else {
        cmp = String(A).localeCompare(String(B))
      }

      if (cmp === 0) {
        const kA = String(getRowKey(a))
        const kB = String(getRowKey(b))
        cmp = kA < kB ? -1 : kA > kB ? 1 : 0
      }

      return dir * cmp
    })
  }, [sortDescriptor, rows, columns, getRowKey])

  /** renderiza acciones extra (agrupadas opcionalmente por `section`) */
  const renderExtraActions = (row: T) => {
    const staticActions = (adapter.actions as MenuAction<T>[] | undefined) ?? []
    const dynamicActions = adapter.rowActions?.(row) ?? []
    const all = [...staticActions, ...dynamicActions]

    if (!all.length) return null

    // agrupar por sección
    const groups = new Map<string | undefined, MenuAction<T>[]>()
    for (const a of all) {
      const hidden = typeof a.hidden === 'function' ? a.hidden(row) : a.hidden
      if (hidden) continue
      const k = a.section
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(a)
    }

    return (
      <>
        {[...groups.entries()].map(([section, actions]) => {
          const items = actions.map((a) => {
            const disabled = typeof a.disabled === 'function' ? a.disabled(row) : a.disabled
            return (
              <DropdownItem key={a.key} color={a.color} isDisabled={!!disabled} onPress={() => a.onPress(row)} startContent={a.icon}>
                {a.label}
              </DropdownItem>
            )
          })

          return section ? (
            <DropdownSection key={`section-${section}`} title={section}>
              {items}
            </DropdownSection>
          ) : (
            <>{items}</>
          )
        })}
      </>
    )
  }

  const renderPreset = (preset: PresetKey, row: T, column: Key): ReactElement | null => {
    switch (preset) {
      case 'money': {
        const raw = (row as any)[String(column)]
        if (raw == null || Number.isNaN(Number(raw))) return null
        const value = Number(raw)
        const content = value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
        return <>{content}</>
      }

      case 'date': {
        // OBTENER config como DateConfig de forma segura
        const cfg = columns.find((c) => String(c.key) === String(column))?.presetConfig as DateConfig | undefined

        // Valor crudo en la fila (puede ser Date, string ISO, timestamp, etc.)
        const raw = (row as any)[String(column)]

        // Normaliza a Date (usa tu util existente)
        const d = toDate(raw)
        if (!d) return null

        // Defaults/overrides desde la config
        const type = cfg?.type ?? 'absolute' // 'absolute' | 'relative'
        const format = cfg?.format ?? 'full' // 'full' | 'short' | 'time' | 'date' | 'relative'
        const locale = cfg?.locale ?? 'es-MX'
        const timeZone = cfg?.timeZone // opcional

        if (type === 'relative' || format === 'relative') {
          // Si te pasan un formateador custom, úsalo; si no, usa uno por defecto
          const content = cfg?.dateFormatter ? cfg.dateFormatter(d) : formatRelativeTime(d, locale)
          return <>{content}</>
        }

        // Absoluto usando tu helper existente
        const content = formatDate(d, format, locale, timeZone)
        return <>{content}</>
      }

      case 'input': {
        const config = columns.find((c) => String(c.key) === String(column))?.presetConfig as InputConfig | undefined
        const width = config?.width || null
        const align = columns.find((c) => c.key === column)?.align || null

        return (
          <Controller
            name={`items.p_${row['id']}.${String(column)}`} // items.p_12.qty
            //control={control}
            rules={{
              required: 'Requerido'
            }}
            render={({ field, fieldState }) => (
              <Input
                //label={columns.find((c) => c.preset === 'input')?.inputLabel || ''}
                type='text'
                size='sm'
                //placeholder={columns.find((c) => c.key === column)?.label || ''}
                variant='bordered'
                isInvalid={!!fieldState.error}
                {...field}
                classNames={{
                  inputWrapper: `bg-white ${width ? `${width}` : ''} `,
                  mainWrapper: `items-${align} pr-4`,
                  input: `text-${align}`
                }}
              />
            )}
          />
        )
      }
      case 'is_active': {
        const field = adapter.fields?.active ?? ('is_active' as keyof T & string)
        if (!(field in (row as any)) || !adapter.update) return null

        const value = !!(row as any)[field]

        const rowSend = row

        return (
          <Switch
            size='sm'
            isSelected={value}
            onClick={(e) => e.stopPropagation()}
            onValueChange={async (next) => {
              const id = adapter.getId(row)
              await adapter.update!(id, { [field]: next }, rowSend)
              adapter.afterChange?.()
            }}
          />
        )
      }

      case 'featured': {
        const field = adapter.fields?.featured ?? ('featured' as keyof T & string)
        if (!(field in (row as any)) || !adapter.update) return null
        const rowSend = row
        const value = !!(row as any)[field]
        const click = async (e: React.MouseEvent) => {
          e.stopPropagation()
          const id = adapter.getId(row)
          await adapter.update!(id, { [field]: !value }, rowSend)
          adapter.afterChange?.()
        }
        return (
          <button onClick={click} className='inline-flex items-center'>
            {value ? <Star fill='#ffde55' stroke='#ce7f00' /> : <Star />}
          </button>
        )
      }

      case 'actions': {
        const canEdit = !!adapter.edit
        const canDelete = !!adapter.delete || !!adapter.onRequestDelete
        const hasExtras = (adapter.actions && adapter.actions.length > 0) || !!adapter.rowActions

        if (!canEdit && !canDelete && !hasExtras) return null

        return (
          <Dropdown>
            <DropdownTrigger>
              <Button variant='bordered' isIconOnly size='sm' onClick={(e) => e.stopPropagation()}>
                <EllipsisVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label='Acciones'>
              {renderExtraActions(row)}
              {canEdit ? (
                <DropdownItem key='__edit' onPress={() => adapter.edit!(row)}>
                  Editar
                </DropdownItem>
              ) : null}

              {adapter.onRequestDelete ? (
                <DropdownItem
                  key='__delete_req'
                  className='text-danger'
                  color='danger'
                  onPress={() => adapter.onRequestDelete!(adapter.getId(row), row)}
                >
                  Eliminar
                </DropdownItem>
              ) : adapter.delete ? (
                <DropdownItem
                  key='__delete'
                  className='text-danger'
                  color='danger'
                  onPress={async () => {
                    const id = adapter.getId(row)
                    await adapter.delete!(id)
                    adapter.afterChange?.()
                  }}
                >
                  Eliminar
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        )
      }

      default:
        return null
    }
  }

  const canRowAction = selectionMode === 'single' && selectionBehavior === 'replace' && (!!adapter.edit || !!p.onRowActivate)
  const tableRef = useRef<HTMLTableElement | null>(null)

  //const isKeySelected = (selectedKeys: Selection, key: Key) => selectedKeys === 'all' || (selectedKeys as Set<Key>).has(key)

  const keyToStr = (k: Key) => (typeof k === 'string' ? k : String(k))

  const rowMap = useMemo(() => {
    const m = new Map<string, T>()
    for (const r of rows) m.set(keyToStr(getRowKey(r)), r)
    return m
  }, [rows, getRowKey])

  const { onRowActivate } = p

  const handleRowActivate = useCallback(
    async (row: T) => {
      if (onRowActivate) return onRowActivate(row)
      if (adapter.edit) return adapter.edit(row)
    },
    [onRowActivate, adapter]
  )

  const handleRowAction = useCallback(
    async (key: Key) => {
      if (!canRowAction) return
      const row = rowMap.get(keyToStr(key))
      if (!row) return
      await handleRowActivate(row)
    },
    [canRowAction, rowMap, handleRowActivate]
  )

  return (
    <>
      <section
        style={
          maxHeight
            ? {
                maxHeight: `${maxHeight}px`,
                height: `${(tableRef.current?.offsetHeight ?? 0) > maxHeight ? maxHeight : (tableRef.current?.offsetHeight ?? 0) + 35}px`
              }
            : undefined
        }
        className='border-default-200  rounded-large border shadow-sm bg-white'
      >
        <Table
          isHeaderSticky
          aria-label='Data table'
          rowHeight={40}
          selectedKeys={selectedKeys}
          selectionMode={selectionMode}
          selectionBehavior={selectionBehavior}
          onSelectionChange={onSelectionChange}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
          disallowEmptySelection={disallowEmptySelection}
          // bottomContent={bottomContent}
          onRowAction={canRowAction ? handleRowAction : undefined}
          // className='max-h-full'
          classNames={{
            base: `max-h-full overflow-auto`,
            wrapper: `shadow-none `
          }}
          ref={tableRef}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={String(column.key)} allowsSorting={!!column.allowsSorting} align={column.align ?? 'start'}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={sortedItems}>
            {(row) => {
              // const rowKey = getRowKey(row)
              // const rowIsSelected = isKeySelected(selectedKeys, rowKey)

              return (
                <TableRow key={getRowKey(row)}>
                  {(columnKey) => {
                    const col = columns.find((c) => String(c.key) === String(columnKey))
                    let content: React.ReactNode
                    switch (true) {
                      case !!col?.render:
                        content = col!.render!(row)
                        break
                      case !!col?.preset:
                        content = renderPreset(col!.preset!, row, columnKey)
                        break

                      default:
                        content = (row as any)[String(col?.key)]
                    }
                    return <TableCell>{content}</TableCell>
                  }}
                </TableRow>
              )
            }}
          </TableBody>
        </Table>
      </section>
      {bottomContent}
    </>
  )
}
