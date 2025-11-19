import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import CloseRouteModal from '../../components/modals/admin/CloseRouteModal'
import type { RootState } from '../../store/store'
import { delivery_types, deliveryRoutesMap, storeShipment_status } from '../../types/storeOrders'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const EnviosTienda = () => {
  const navigate = useNavigate()
  const storeOrders = useSelector((state: RootState) => state.storeOrders.items)

  type Row = {
    id: string
    ci: number
    name: string
    total_items: number
    delivery_date: string
    delivery_route: string
    shipment_status: string
    postal_code: string
    delivery_type: string
    total_price: number
    order_status: string
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'ci',
      label: '#',
      allowsSorting: true
    },
    {
      key: 'name',
      label: 'Nombre',
      allowsSorting: false
    },
    {
      key: 'total_items',
      label: 'Productos',
      allowsSorting: false
    },
    {
      key: 'delivery_date',
      label: 'Fecha de entrega',
      allowsSorting: true
    },
    {
      key: 'delivery_type',
      label: 'Tipo de entrega',
      allowsSorting: true,
      align: 'center',
      preset: 'type',
      presetConfig: { map: delivery_types, wrapper: { type: 'chip', variant: 'bordered' } }
    },
    {
      key: 'delivery_route',
      label: 'Ruta de entrega',
      allowsSorting: true,
      preset: 'type',
      presetConfig: { map: deliveryRoutesMap }
    },
    {
      key: 'shipment_status',
      label: 'Status del envío',
      allowsSorting: true,
      preset: 'type',
      presetConfig: { map: storeShipment_status, wrapper: { type: 'chip', variant: 'flat' } }
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
    column: 'ci',
    direction: 'descending'
  })

  const handleDetails = (row: Row) => {
    sessionStorage.setItem('admin_selected_store_order', JSON.stringify(storeOrders.find((order) => order.id === row.id)))
    navigate(`/admin/orden/${row.id}`)
  }
  const handleCloseRoute = () => {
    onOpenCloseRoute()
  }

  const { isOpen: isOpenCloseRoute, onOpen: onOpenCloseRoute, onClose: onCloseCloseRoute } = useDisclosure()

  const filteredRows = useMemo(() => {
    const paidOrders = storeOrders.filter((order) => order.order_status === 'credited')
    return applyToolbarFilters(paidOrders, ['name'], criteria)
  }, [storeOrders, criteria])

  return (
    <section className='space-y-4'>
      <ToolbarTable<Row>
        rows={storeOrders}
        searchFilter={['name']}
        filters={[
          { label: 'Status', column: 'shipment_status', multiple: true },
          { label: 'Ruta', column: 'delivery_route', multiple: true }
        ]}
        buttons={[{ label: 'Cerrar ruta', onPress: handleCloseRoute, color: 'primary' as const }]}
        onCriteriaChange={setCriteria}
      />
      <DataTable<Row>
        entity='storeShipments'
        rows={filteredRows}
        columns={columns}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        selectionMode='single'
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        getRowKey={(row) => row.id as string} //en number no funciona y quitando
        onRowActivate={(row) => {
          handleDetails(row)
        }}
        adapterOverrides={{
          actions: [
            {
              key: 'details',
              label: 'Ver detalle',
              onPress: (row) => {
                handleDetails(row)
              }
            }
          ]
        }}
      />
      <CloseRouteModal isOpen={isOpenCloseRoute} onOpenChange={onCloseCloseRoute} />
    </section>
  )
}

export default EnviosTienda
