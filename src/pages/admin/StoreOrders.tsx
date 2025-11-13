import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import PaymentConfirmModal from '../../components/modals/admin/PaymentConfirmModal'
import PaymentUploadModal from '../../components/modals/common/paymentUploadModal'
import { setSelectedOrder } from '../../store/slices/storeOrdersSlice'
import type { RootState } from '../../store/store'
import { deliveryTypesMap, storeOrder_status } from '../../types/storeOrders'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const PedidosTienda = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const storeOrders = useSelector((state: RootState) => state.storeOrders.items)

  type Row = {
    id: string
    ci: number
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

  const { isOpen: isOpenPaymentUpload, onOpen: OnOpenPaymentUpload, onOpenChange: onOpenChangePaymentUpload } = useDisclosure()
  const { isOpen: IsOpenPaymentConfirm, onOpen: onOpenPaymentConfirm, onOpenChange: OnOpenChangePaymentConfirm } = useDisclosure()

  const handlePaymentUpload = (row: Row) => {
    dispatch(setSelectedOrder(row.id))
    OnOpenPaymentUpload()
  }
  const handlePaymentConfirm = (row: Row) => {
    dispatch(setSelectedOrder(row.id))
    onOpenPaymentConfirm()
  }

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
          edit: (row) => {
            console.log('Editar orden de tienda', row)
            sessionStorage.setItem('admin_selected_store_order', JSON.stringify(storeOrders.find((order) => order.id === row.id)))
            navigate(`/admin/orden/${row.id}`)
          },
          actions: [
            {
              key: 'details',
              label: 'Ver detalle',
              onPress: (row) => {
                navigate(`/admin/orden/${row.id}`)
              }
            },
            {
              key: 'register_payment',
              label: 'Registrar pago',
              onPress: (row) => {
                handlePaymentUpload(row)
              }
            },
            {
              key: 'prove_payment',
              label: 'Acreditar pago',
              onPress: (row) => {
                handlePaymentConfirm(row)
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

      <PaymentConfirmModal isOpen={IsOpenPaymentConfirm} onOpenChange={OnOpenChangePaymentConfirm} />

      <PaymentUploadModal isOpen={isOpenPaymentUpload} onOpenChange={onOpenChangePaymentUpload} />
    </section>
  )
}

export default PedidosTienda
