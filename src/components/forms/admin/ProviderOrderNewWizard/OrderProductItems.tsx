import type { Selection, SortDescriptor } from '@heroui/react'
import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../../store/store'
import { DataTable, type AlignPreset, type PresetKey } from '../../../common/DataTable'

type Row = {
  id: number
  name: string
  price: number
  category: string
  stock?: number
  is_active: boolean
  featured: boolean
}

type selectedProductsType = { selected_products: number[] }

type Props = {
  data?: selectedProductsType
}

const OrderProductItems = ({ data }: Props) => {
  const products = useSelector((state: RootState) => state.products.items)

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'price', direction: 'ascending' })
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
  const filteredRows = products.filter((p) => data?.selected_products?.includes(p.id))

  const {
    formState: { errors }
  } = useFormContext()

  // selectedKeys para la tabla

  const columns = [
    { key: 'name', label: 'Producto', allowsSorting: true },
    { key: 'category', label: 'Categoría', allowsSorting: true },
    {
      key: 'qty',
      label: 'Cantidad',
      align: 'end' as AlignPreset,
      preset: 'input' as PresetKey,
      presetConfig: { width: 'max-w-[50px]' },
      allowsSorting: true
    }
  ]

  return (
    <form>
      {errors.items && (
        <p className='text-danger flex items-center gap-1 justify-center text-sm mb-4'>
          <TriangleAlert />
          Todos los productos deben tener una cantidad asignada.
        </p>
      )}

      <DataTable<Row>
        entity='products'
        rows={filteredRows}
        columns={columns}
        getRowKey={(row) => String(row.id)}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        selectionMode='single'
        selectionBehavior='replace'
        maxHeight={280}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        bottomContent={null}
      />
    </form>
  )
}

export default OrderProductItems
