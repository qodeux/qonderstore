import type { Selection, SortDescriptor } from '@heroui/react'
import { TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../../store/store'
import { DataTable, type AlignPreset } from '../../../common/DataTable'

type Row = {
  id: number
  name: string
  price: number
  category: string
  stock?: number
  is_active: boolean
  featured: boolean
}

const OrderProductSelection = () => {
  const products = useSelector((state: RootState) => state.products.items)
  const { selectedProvider } = useSelector((state: RootState) => state.providers)

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'stock', direction: 'ascending' })
  const filteredRows = products.filter((p) => selectedProvider?.selected_products?.includes(p.id))

  const {
    control,
    watch,
    formState: { errors }
  } = useFormContext()
  const allIds = useMemo(() => filteredRows.map((r) => r.id), [filteredRows])
  // Valor actual del campo (reactivo) y cómputo de "todos"
  const watchedSelectedProducts = watch('selected_products')
  const current = useMemo(() => watchedSelectedProducts ?? [], [watchedSelectedProducts])
  const isAll = useMemo(
    () => allIds.length > 0 && current.length === allIds.length && allIds.every((id) => (current as number[]).includes(id)),
    [current, allIds]
  )

  // selectedKeys para la tabla
  const selectedForTable: Selection = useMemo(() => (isAll ? 'all' : new Set((current as number[]).map(String))), [isAll, current])

  const columns = [
    { key: 'name', label: 'Producto', allowsSorting: true },
    { key: 'category', label: 'Categoría', allowsSorting: true },
    { key: 'stock', label: 'Existencias', allowsSorting: true, align: 'center' as AlignPreset }
  ]

  return (
    <form>
      {errors.selected_products && (
        <p className='text-danger flex items-center gap-1 justify-center text-sm mb-4'>
          <TriangleAlert />
          {errors.selected_products.message as string}
        </p>
      )}

      <Controller
        name='selected_products'
        control={control}
        render={({ field }) => (
          <DataTable<Row>
            entity='products'
            rows={filteredRows}
            columns={columns}
            getRowKey={(row) => String(row.id)}
            selectedKeys={selectedForTable}
            onSelectionChange={(keys) => {
              const next = keys === 'all' ? allIds : Array.from(keys as Set<React.Key>).map((k) => Number(k))

              field.onChange(next)
            }}
            selectionMode='multiple'
            selectionBehavior='toggle'
            maxHeight={280}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          />
        )}
      />
    </form>
  )
}

export default OrderProductSelection
