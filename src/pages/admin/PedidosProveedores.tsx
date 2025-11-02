import { useState } from 'react'
import { useSelector } from 'react-redux'
import { type ColumnDef } from '../../components/common/DataTable'
import type { ToolbarCriteria } from '../../components/common/ToolbarTable'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const PedidosProveedores = () => {
  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })
  const providersOrders = useSelector((state: RootState) => state.providersOrders.selectedOrderId) ?? [] // Replace with actual selector from store
  const filteredRows = applyToolbarFilters(providersOrders, ['id'], criteria)

  type Row = {
    id: number
    order: string
    items?: string | null
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'id',
      label: 'ID',
      allowsSorting: true
    },
    {
      key: 'order',
      label: 'Pedido',
      allowsSorting: true
    },
    {
      key: 'items',
      label: 'Productos',
      allowsSorting: false
    }
  ]

  return (
    // <section className='space-y-4'>
    //   <DataTable<Row>
    //     entity='providers_orders'
    //     rows={filteredRows}
    //     columns={columns}
    //     selectedKeys={selectedKeys}
    //     onSelectionChange={setSelectedKeys}
    //     selectionMode='single'
    //     sortDescriptor={sortDescriptor}
    //     onSortChange={setSortDescriptor}
    //     getRowKey={(row) => row.id as number}
    //   />
    // </section>

    <div>kiubolas no se deja</div>
  )
}

export default PedidosProveedores
