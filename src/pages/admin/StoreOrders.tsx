import type { Selection, SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import type { RootState } from '../../store/store'
import { deliveryTypesMap, storeOrder_status } from '../../types/storeOrders'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const PedidosTienda = () => {
  const storeOrders = useSelector((state: RootState) => state.storeOrders.items)

  type Row = {
    id: string
    name: string

    delivery_type: string
    delivery_date: string
    total_price: number
    shipping_price: number
    order_status: string
    order_total: number
    total_items: number
    created_at: string
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      label: 'Nombre',
      allowsSorting: false
    },
    {
      key: 'total_items',
      label: 'Productos',
      allowsSorting: false,
      align: 'center'
    },

    {
      key: 'created_at',
      label: 'Fecha compra',
      allowsSorting: true,
      preset: 'date'
    },
    {
      key: 'last_update',
      label: 'Actualizado',
      allowsSorting: true,
      preset: 'date',
      hidden: true
    },

    {
      key: 'delivery_type',
      label: 'Tipo de entrega',
      allowsSorting: true,
      align: 'center',
      preset: 'type',
      presetConfig: { map: deliveryTypesMap }
    },
    {
      key: 'order_total',
      label: 'Precio total',
      allowsSorting: true,
      preset: 'money',
      align: 'end'
    },

    {
      key: 'order_status',
      label: 'Status de la orden',
      allowsSorting: true,
      preset: 'type',
      presetConfig: { map: storeOrder_status, wrapper: { type: 'chip', variant: 'flat' } }
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
    column: 'last_update',
    direction: 'descending'
  })

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(storeOrders, ['name'], criteria)
  }, [storeOrders, criteria])

  return (
    <section className='space-y-4'>
      <ToolbarTable<Row>
        rows={storeOrders}
        searchFilter={['name']}
        filters={[
          { label: 'Tipo de entrega', column: 'delivery_type', multiple: false },
          { label: 'Status de la orden', column: 'order_status', multiple: true }
        ]}
        //buttons={toolbarButtons}
        onCriteriaChange={setCriteria}
      />
      <DataTable<Row>
        entity='storeOrders'
        rows={filteredRows}
        columns={columns}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        selectionMode='single'
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        getRowKey={(row) => row.id as string} //en number no funciona y quitando
        adapterOverrides={{
          actions: [
            {
              key: 'details',
              label: 'Ver detalle',
              onPress: (row) => {
                console.log('Ver detalle', row)
              }
            },
            {
              key: 'register_payment',
              label: 'Registrar pago',
              onPress: (row) => {
                console.log('Registrar pago', row)
              }
            },
            {
              key: 'prove_payment',
              label: 'Acreditar pago',
              onPress: (row) => {
                console.log('Registrar pago', row)
              }
            },
            {
              key: 'cancelled',
              label: 'Cancelar orden',
              onPress: (row) => {
                console.log('Registrar pago', row)
              }
            }
          ]
        }}
      />
    </section>
  )
}

export default PedidosTienda
