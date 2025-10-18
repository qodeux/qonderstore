import { type Selection, type SortDescriptor } from '@heroui/react'
import { TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../../store/store'
import { applyToolbarFilters } from '../../../../utils/toolbarFilters'
import { DataTable } from '../../../common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../../common/ToolbarTable'

type Row = {
  id: number
  name: string
  price: number
  category: string
  stock?: number
  is_active: boolean
  featured: boolean
}

const ProductSelection = () => {
  const products = useSelector((s: RootState) => s.products.items)

  // Hooks del form (a nivel de componente)
  const { control, watch } = useFormContext<{ selected_products: number[] }>()
  const { errors } = useFormState({ control, name: ['selected_products'] })

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({ searchText: '', selected: {} })
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'price', direction: 'ascending' })

  // Filtrado y claves "visibles"
  const filteredRows = useMemo(() => applyToolbarFilters(products, ['name'], criteria), [products, criteria])
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
    { key: 'stock', label: 'Existencias', allowsSorting: true }
  ]

  return (
    <section className='space-y-4'>
      <ToolbarTable<Row>
        rows={products}
        searchFilter={['name']}
        filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
        onCriteriaChange={setCriteria}
      />

      {errors.selected_products && (
        <p className='text-danger flex items-center gap-1 justify-center text-sm'>
          <TriangleAlert />
          {errors.selected_products.message}
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
    </section>
  )
}

export default ProductSelection
