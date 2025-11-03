import type { Selection, SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import type { OrderItem } from '../../schemas/providersOrders.schema'
import type { RootState } from '../../store/store'
import { supplyOrdersStatusMap } from '../../types/supplyOrders'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const PedidosProveedores = () => {
  const supplyOrders = useSelector((state: RootState) => state.supplyOrders.items)

  type Row = {
    id: number
    provider_id?: number
    provider_name: string
    items: OrderItem[]
    created_at: string
    last_payment?: string
    status: string
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'id',
      label: 'Orden',
      allowsSorting: true
    },
    {
      key: 'provider_name',
      label: 'Nombre del proveedor',
      allowsSorting: true
    },
    {
      key: 'created_at',
      label: 'Fecha de creación',
      allowsSorting: true,
      preset: 'date'
    },
    {
      key: 'last_payment',
      label: 'Último pago',
      allowsSorting: true,
      preset: 'date'
    },
    {
      key: 'status',
      label: 'Status de la orden',
      allowsSorting: true,
      preset: 'type',
      presetConfig: { map: supplyOrdersStatusMap, wrapper: { type: 'chip', variant: 'flat' } }
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false,
      preset: 'actions'
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  })

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(supplyOrders, ['provider_name'], criteria)
  }, [supplyOrders, criteria])

  return (
    <section className='space-y-4'>
      <ToolbarTable<Row>
        rows={supplyOrders}
        searchFilter={['provider_name']}
        //filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
        //buttons={toolbarButtons}
        onCriteriaChange={setCriteria}
      />
      <DataTable<Row>
        entity='supplyOrders'
        rows={filteredRows}
        columns={columns}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        selectionMode='single'
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        getRowKey={(row) => row.id as number}
        adapterOverrides={{
          actions: [
            {
              key: 'supply-order',
              label: 'Suminstrar pedido',
              onPress: (row) => {
                console.log('Suministrar pedido', row)
              }
            },
            {
              key: 'register-payment',
              label: 'Registrar pago',
              onPress: (row) => {
                console.log('Registrar pago', row)
              }
            }
          ],
          onRequestDelete: (_id, item) => {
            console.log('Solicitar eliminación de pedido de proveedor', item)
          }
        }}
      />
    </section>
  )
}

export default PedidosProveedores
