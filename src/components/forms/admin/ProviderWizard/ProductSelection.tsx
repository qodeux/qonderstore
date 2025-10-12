import type { Selection, SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../../store/store'
import { applyToolbarFilters } from '../../../../utils/toolbarFilters'
import { DataTable } from '../../../common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../../common/ToolbarTable'

const ProductSelection = () => {
  const products = useSelector((state: RootState) => state.products.items)

  type Row = {
    id: number
    name: string
    price: number
    category: string
    stock?: number
    is_active: boolean
    featured: boolean
  }

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      allowsSorting: true
    },

    {
      key: 'category',
      label: 'Categoría',
      allowsSorting: true
    },
    {
      key: 'stock',
      label: 'Existencias',
      allowsSorting: true
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'price',
    direction: 'ascending'
  })

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(products, ['name'], criteria)
  }, [products, criteria])

  return (
    <section>
      <section className='space-y-4'>
        <ToolbarTable<Row>
          rows={products}
          searchFilter={['name']}
          filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          maxHeight={280}
          entity='products'
          rows={filteredRows}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionMode='multiple'
          selectionBehavior='toggle'
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          getRowKey={(row) => row.id as number}
        />
      </section>
    </section>
  )
}

export default ProductSelection
