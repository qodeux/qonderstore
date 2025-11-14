import type { Selection, SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import type { RootState } from '../../store/store'
import { storeOrdersStatusMap } from '../../types/storeOrders'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const EnviosTienda = () => {
  const storeOrders = useSelector((state: RootState) => state.storeOrders.items)

  type Row = {
    id: string
    name: string
    postal_code: string
    delivery_type: string
    delivery_date: string
    total_price: number
    order_status: string
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'id',
      label: 'ID orden',
      allowsSorting: false
    },
    {
      key: 'name',
      label: 'Nombre',
      allowsSorting: false
    },
    {
      key: 'postal_code',
      label: 'Código postal',
      allowsSorting: false
    },
    {
      key: 'delivery_type',
      label: 'Tipo de entrega',
      allowsSorting: true
    },
    {
      key: 'delivery_date',
      label: 'Fecha de entrega',
      allowsSorting: true
    },
    {
      key: 'total_price',
      label: 'Total orden',
      allowsSorting: false
    },
    {
      key: 'status',
      label: 'Status de la orden',
      allowsSorting: true,
      preset: 'type',
      presetConfig: { map: storeOrdersStatusMap, wrapper: { type: 'chip', variant: 'flat' } }
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
    column: 'delivery_date',
    direction: 'descending'
  })

  const filteredRows = useMemo(() => {
    const paidOrders = storeOrders.filter((order) => order.order_status === 'credited')
    return applyToolbarFilters(paidOrders, ['name'], criteria)
  }, [storeOrders, criteria])

  //   const filteredRows = applyToolbarFilters(
  //     storeOrders.filter((r) => r.order_status === 'aproved'),
  //     ['order_status'],
  //     criteria
  //   )

  return (
    <section className='space-y-4'>
      <ToolbarTable<Row>
        rows={storeOrders}
        searchFilter={['name']}
        //filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
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
            }
          ]
        }}
      />
    </section>
  )
}

export default EnviosTienda
