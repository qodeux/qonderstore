/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
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
import { useMemo } from 'react'
import { entityRegistry, type EntityAdapter, type EntityKind, type MenuAction } from '../../services/entityRegistry'
import { formatDate, toDate } from '../../utils/date'

export type PresetKey = 'is_active' | 'featured' | 'actions'
export type DatePreset = 'full' | 'only-date' | 'relative' | 'time'

export type ColumnDef<T> = {
  key: keyof T | string
  label: string
  allowsSorting?: boolean
  preset?: PresetKey
  render?: (row: T) => React.ReactNode
  sortAccessor?: (row: T) => string | number
  align?: 'start' | 'center' | 'end'

  type?: 'date'
  datePreset?: DatePreset
  locale?: string
  timeZone?: string
  dateFormatter?: (d: Date) => React.ReactNode
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

  /** modo recomendado: la tabla resuelve todo via registry */
  entity: EntityKind

  /** overrides puntuales (abrir modal, confirm delete, afterChange, acciones extra, etc.) */
  adapterOverrides?: Partial<EntityAdapter<T>>

  /** opcional: pasar adapter completo (casi nunca necesario) */
  resource?: EntityAdapter<T>
}

const DefaultFooter = ({ selectionCount, totalRows }: { selectionCount: number; totalRows: number }) => (
  <section className='flex justify-between items-center mt-4'>
    <div>
      <span>{totalRows} resultados </span>
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
    return [...rows].sort((a, b) => {
      const colKey = sortDescriptor.column as string | undefined
      if (!colKey) return 0

      const col = columns.find((c) => String(c.key) === colKey)
      const va = col?.sortAccessor ? col.sortAccessor(a) : (a as any)[colKey]
      const vb = col?.sortAccessor ? col.sortAccessor(b) : (b as any)[colKey]

      // NUEVO: si es columna de fecha, ordenar por timestamp
      if (col?.type === 'date') {
        const ta = toDate(va)?.getTime() ?? 0
        const tb = toDate(vb)?.getTime() ?? 0
        const cmpNum = ta - tb
        const cmp = cmpNum < 0 ? -1 : cmpNum > 0 ? 1 : 0
        return sortDescriptor.direction === 'descending' ? -cmp : cmp
      }

      const A = typeof va === 'string' ? va.toLowerCase() : va
      const B = typeof vb === 'string' ? vb.toLowerCase() : vb
      const cmp = A < B ? -1 : A > B ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, rows, columns])

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

  const renderPreset = (preset: PresetKey, row: T): ReactElement | null => {
    switch (preset) {
      case 'is_active': {
        const field = adapter.fields?.active ?? ('is_active' as keyof T & string)
        if (!(field in (row as any)) || !adapter.update) return null

        const value = !!(row as any)[field]
        return (
          <Switch
            size='sm'
            isSelected={value}
            onClick={(e) => e.stopPropagation()}
            onValueChange={async (next) => {
              const id = adapter.getId(row)
              await adapter.update!(id, { [field]: next })
              adapter.afterChange?.()
            }}
          />
        )
      }

      case 'featured': {
        const field = adapter.fields?.featured ?? ('featured' as keyof T & string)
        if (!(field in (row as any)) || !adapter.update) return null

        const value = !!(row as any)[field]
        const click = async (e: React.MouseEvent) => {
          e.stopPropagation()
          const id = adapter.getId(row)
          await adapter.update!(id, { [field]: !value })
          adapter.afterChange?.()
        }
        return (
          <button onClick={click} className='inline-flex items-center'>
            {value ? <Star fill='#111' /> : <Star />}
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
              {canEdit ? (
                <DropdownItem key='__edit' onPress={() => adapter.edit!(row)}>
                  Editar
                </DropdownItem>
              ) : null}

              {renderExtraActions(row)}

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

  return (
    <Table
      aria-label='Data table'
      selectedKeys={selectedKeys}
      selectionMode={selectionMode}
      selectionBehavior={selectionBehavior}
      onSelectionChange={onSelectionChange}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      bottomContent={bottomContent}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={String(column.key)} allowsSorting={!!column.allowsSorting} align={column.align ?? 'start'}>
            {column.label}
          </TableColumn>
        )}
      </TableHeader>

      <TableBody items={sortedItems}>
        {(row) => (
          <TableRow key={getRowKey(row)}>
            {(columnKey) => {
              const col = columns.find((c) => String(c.key) === String(columnKey))

              let content: React.ReactNode

              switch (true) {
                case !!col?.render:
                  content = col!.render!(row)
                  break
                case !!col?.preset:
                  content = renderPreset(col!.preset!, row)
                  break
                case col?.type === 'date': {
                  const raw = (row as any)[String(col.key)]
                  if (col.dateFormatter) {
                    const d = toDate(raw)
                    content = d ? col.dateFormatter(d) : ''
                  } else {
                    content = formatDate(raw, col.datePreset ?? 'full', col.locale ?? 'es-MX', col.timeZone)
                  }
                  break
                }
                default:
                  content = (row as any)[String(col?.key)]
              }
              return <TableCell>{content}</TableCell>
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
