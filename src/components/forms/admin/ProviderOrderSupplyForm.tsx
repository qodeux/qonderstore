import { Select, SelectItem, type Selection, type SortDescriptor } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { makeSelectOrdersWithProductDetailsByProvider } from '../../../store/selectors/supplyOrdersByProvider'
import type { RootState } from '../../../store/store'
import type { SupplyOrder } from '../../../types/providers'
import { DataTable, type PresetKey } from '../../common/DataTable'

type Row = {
  id: number
  name: string
  qty: number
  qty_received: number | undefined
  category: string
}

const ProviderOrderSupplyForm = () => {
  const { selectedProvider } = useSelector((state: RootState) => state.providers)

  const selectOrdersByProvider = useMemo(() => makeSelectOrdersWithProductDetailsByProvider(), [])

  const orders = useSelector((state: RootState) => (selectedProvider ? selectOrdersByProvider(state, selectedProvider.id) : []))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending'
  })
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const { control, watch, setValue } = useFormContext()
  const selectedOrder = watch('order')

  const columns = [
    { key: 'name', label: 'Producto', allowsSorting: true },
    { key: 'category', label: 'Categoría', allowsSorting: true },
    { key: 'qty', label: 'Pedido', allowsSorting: true },
    { key: 'qty_received', label: 'Recibido', allowsSorting: true, preset: 'input' as PresetKey, presetConfig: { width: 'max-w-[50px]' } }
  ]

  const orderItems: Row[] = useMemo(() => {
    if (!selectedOrder) return []
    const order = orders.find((o) => o.id === selectedOrder)
    if (!order) return []
    return order.items.map((item) => ({
      id: item.id,
      name: item.product?.name ?? 'Sin nombre',
      category: item.product?.category ?? 'Sin categoría',
      qty: item.qty,
      qty_received: undefined
    }))
  }, [selectedOrder, orders])

  useEffect(() => {
    if (orders.length > 0) {
      setValue('order', orders[0].id, { shouldValidate: true })
    }
  }, [orders, setValue])

  return (
    <form>
      <section className='grid grid-cols-2 gap-4 items-center mb-6'>
        <h4>Proveedor: {selectedProvider?.name}</h4>

        <Controller
          name='order'
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label='Pedido'
              size='sm'
              selectionMode='single'
              selectedKeys={field.value !== undefined && field.value !== null ? new Set([String(field.value)]) : new Set()}
              onSelectionChange={(keys) => {
                if (keys === 'all') return
                const key = keys.values().next().value as string | undefined
                field.onChange(key ? Number(key) : undefined)
              }}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message as string}
              disallowEmptySelection
            >
              {orders.map((order: SupplyOrder) => (
                <SelectItem key={String(order.id)} textValue={`#${order.id} - ${new Date(order.created_at).toLocaleDateString()}`}>
                  #{order.id} - {new Date(order.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </section>

      {selectedOrder && (
        <DataTable<Row>
          entity='products'
          rows={orderItems}
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
      )}
    </form>
  )
}

export default ProviderOrderSupplyForm
