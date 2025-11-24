import { Card, Chip, useDisclosure } from '@heroui/react'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useProductRatings } from '../../hooks/useProductRatings'
import { setSelectedOrder } from '../../store/slices/storeOrdersSlice'
import { useAppSelector } from '../../store/store'
import { storeOrder_status, storeShipment_status } from '../../types/storeOrders'
import { formatDate } from '../../utils/date'
import { formatMoney } from '../../utils/money'
import OrderDetailsModal from '../modals/customer/OrderDetailsModal'

const OrderHistory = () => {
  const { user } = useAppSelector((state) => state.auth)

  const dispatch = useDispatch()
  useProductRatings({ userId: user?.id })

  const { items: orders, selectedOrder } = useAppSelector((state) => state.storeOrders)

  const { isOpen: isOrderDetailsOpen, onOpenChange: onOrderDetailsOpenChange, onOpen: onOrderDetailsOpen } = useDisclosure()

  const handleOpenOrderDetails = (orderId: string) => {
    dispatch(setSelectedOrder(orderId))
    onOrderDetailsOpen()
  }

  useEffect(() => {
    if (selectedOrder) {
      dispatch(setSelectedOrder(selectedOrder.id))
    }
  }, [dispatch, orders, selectedOrder])
  return (
    <div>
      {orders.length === 0 ? (
        <p className='text-gray-600'>Aún no has realizado ningún pedido.</p>
      ) : (
        orders.map((order) => {
          const orderStatus = storeOrder_status.find((status) => status.key === order.order_status)
          const shipmentStatus = storeShipment_status.find((status) => status.key === order.shipment_status)

          return (
            <Card
              className='bg-white grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md'
              shadow='sm'
              isPressable
              fullWidth
              key={order.id}
              onPress={() => handleOpenOrderDetails(order.id)}
            >
              <div className='text-left'>
                <h3>
                  <span className='text-neutral-500'>Pedido:</span> {order.id.split('-')[0]}
                </h3>
                <p>
                  <span className='text-neutral-500'>Fecha: </span>
                  {formatDate(order.created_at)}
                </p>
                <p className='text-lg'>
                  {order.total_items} {order.total_items === 1 ? 'artículo' : 'artículos'}
                </p>
              </div>
              <div className='text-left md:text-right space-y-2'>
                <p className='text-2xl'>
                  Total: <span className='font-bold'>{formatMoney(order.order_total)}</span>
                </p>
                <div>
                  Estado:{' '}
                  {order.shipment_status !== null ? (
                    <Chip variant='flat' color={shipmentStatus?.color}>
                      {shipmentStatus?.label}
                    </Chip>
                  ) : (
                    <Chip variant='flat' color={orderStatus?.color}>
                      {orderStatus?.label}
                    </Chip>
                  )}
                </div>
              </div>
            </Card>
          )
        })
      )}
      <OrderDetailsModal isOpen={isOrderDetailsOpen} onOpenChange={onOrderDetailsOpenChange} />
    </div>
  )
}

export default OrderHistory
