/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
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
import type { ReactElement, ReactNode } from 'react'
import { useMemo, type Key } from 'react'

export type PresetKey = 'is_active' | 'featured' | 'actions'

export type ColumnDef<T> = {
  key: keyof T | string
  label: string
  allowsSorting?: boolean
  preset?: PresetKey
  render?: (row: T) => React.ReactNode
  sortAccessor?: (row: T) => string | number
  align?: 'start' | 'center' | 'end'
}

export type ActionsConfig<T> = {
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  extraItems?: (row: T) => ReactNode
  editLabel?: string
  deleteLabel?: string
}

export type TogglesConfig<T> = {
  onToggleActive?: (row: T, next: boolean) => void | Promise<void>
  onToggleFeatured?: (row: T, next: boolean) => void | Promise<void>
}

type Props<T> = {
  columns: ColumnDef<T>[]
  rows: T[]
  selectedKeys: Selection
  onSelectionChange: (s: Selection) => void
  selectionMode?: 'multiple' | 'single' | 'none'
  selectionBehavior?: 'replace' | 'toggle' | undefined
  sortDescriptor: SortDescriptor
  onSortChange: (descriptor: SortDescriptor) => void
  bottomContent?: React.ReactNode
  actions?: ActionsConfig<T>
  toggles?: TogglesConfig<T>
  getRowKey?: (row: T) => Key
}

const TableFooter = ({ selectionCount }: { selectionCount: number }) => {
  return (
    <section className='flex justify-between items-center mt-4'>
      <div>
        {/* {sortedItems.length} {sortedItems.length === 1 ? 'resultado' : 'resultados'} */}
        {selectionCount > 0 && (
          <>
            {' '}
            | {selectionCount} {selectionCount === 1 ? 'seleccionado' : 'seleccionados'}
          </>
        )}
      </div>
      <div>Filtros</div>
    </section>
  )
}

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
    bottomContent = <TableFooter selectionCount={typeof selectedKeys === 'string' ? rows.length : selectedKeys.size} />,
    actions,
    toggles,
    getRowKey = (row) => (row as any).key as Key
  } = p

  const sortedItems = useMemo(() => {
    return [...rows].sort((a, b) => {
      const colKey = sortDescriptor.column as string | undefined
      if (!colKey) return 0

      const col = columns.find((c) => String(c.key) === colKey)
      const va = col?.sortAccessor ? col.sortAccessor(a) : (a as any)[colKey]
      const vb = col?.sortAccessor ? col.sortAccessor(b) : (b as any)[colKey]

      // ordena strings y números de forma segura
      const A = typeof va === 'string' ? va.toLowerCase() : va
      const B = typeof vb === 'string' ? vb.toLowerCase() : vb
      const cmp = A < B ? -1 : A > B ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, rows, columns])

  const renderPreset = (preset: PresetKey, row: T): ReactElement | null => {
    switch (preset) {
      case 'is_active': {
        const value = !!(row as any).is_active
        return (
          <Switch
            size='sm'
            isSelected={value}
            onClick={(e) => e.stopPropagation()} // ← evita seleccionar la fila
            onValueChange={(next) => toggles?.onToggleActive?.(row, next)}
          />
        )
      }

      case 'featured': {
        const value = !!(row as any).featured
        const click = (e: React.MouseEvent) => {
          e.stopPropagation() // ← evita seleccionar la fila
          toggles?.onToggleFeatured?.(row, !value)
        }
        return (
          <button onClick={click} className='inline-flex items-center'>
            {value ? <Star fill='#111' /> : <Star />}
          </button>
        )
      }

      case 'actions': {
        const items: ReactElement[] = []

        if (actions?.onEdit) {
          items.push(
            <DropdownItem key='edit' onPress={() => actions.onEdit!(row)}>
              {actions.editLabel ?? 'Editar'}
            </DropdownItem>
          )
        }

        if (actions?.extraItems) {
          const extra = actions.extraItems(row)
          items.push(...(Array.isArray(extra) ? extra : [extra]))
        }

        if (actions?.onDelete) {
          items.push(
            <DropdownItem key='delete' className='text-danger' color='danger' onPress={() => actions.onDelete!(row)}>
              {actions.deleteLabel ?? 'Eliminar'}
            </DropdownItem>
          )
        }

        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant='bordered'
                isIconOnly
                size='sm'
                //onClick={(e) => e.stopPropagation()} // evita seleccionar la fila
              >
                <EllipsisVertical />
              </Button>
            </DropdownTrigger>

            <DropdownMenu aria-label='Acciones'>
              {actions?.onEdit ? (
                <DropdownItem key='edit' onPress={() => actions.onEdit!(row)}>
                  {actions.editLabel ?? 'Editar'}
                </DropdownItem>
              ) : null}

              {/* //{actions?.extraItems ? actions.extraItems(row) : null} */}

              {actions?.onDelete ? (
                <DropdownItem key='delete' className='text-danger' color='danger' onPress={() => actions.onDelete!(row)}>
                  {actions.deleteLabel ?? 'Eliminar'}
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
          <TableColumn key={String(column.key)} allowsSorting={!!column.allowsSorting} align={column.align ? column.align : 'start'}>
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
              if (col?.render) {
                content = col.render(row)
              } else if (col?.preset) {
                content = renderPreset(col.preset, row)
              } else {
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

//export default DataTable
