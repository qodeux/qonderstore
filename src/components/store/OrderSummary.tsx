import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import type { CartItem } from '../../store/slices/cartSlice'
import { useAppSelector } from '../../store/store'
import type { OrderItem } from '../../types/storeOrders'
import { formatMoney } from '../../utils/money'
import { smartPesosFromCents, toCents } from '../../utils/pricing'
import CartItemBox from './CartItemBox'

type Props = {
  orderId: string
}

const OrderSummary = ({ orderId }: Props) => {
  const { items: storeOrders } = useAppSelector((state) => state.storeOrders)
  const selectedOrder = storeOrders.find((order) => order.id === orderId)

  const cartItems =
    selectedOrder?.items?.map((it: OrderItem) => {
      const quantity = Number(it.quantity ?? 1)

      const finalLineSubtotal = Number(it.price ?? 0)
      const lineDiscount = Number(it.discount ?? 0)

      const baseLineSubtotal = finalLineSubtotal + lineDiscount

      const unitFinalPrice = quantity > 0 ? finalLineSubtotal / quantity : 0
      const unitBasePrice = quantity > 0 ? baseLineSubtotal / quantity : 0

      return {
        id: it.id,
        title: it.title ?? 'Producto',
        image: it.image ?? null,

        quantity,
        saleType: it.saleType,
        unitSelected: it.unitSelected ?? it.base_unit ?? null,
        price: unitFinalPrice,
        basePrice: unitBasePrice,
        discount: lineDiscount
      } as any
    }) ?? []

  const productsTotalRounded = useMemo(() => {
    return smartPesosFromCents(toCents(Number(selectedOrder?.total_price ?? 0)))
  }, [selectedOrder?.total_price])

  const shippingRounded = useMemo(() => {
    return smartPesosFromCents(toCents(Number(selectedOrder?.shipping_price ?? 0)))
  }, [selectedOrder?.shipping_price])

  const orderTotalRounded = useMemo(() => {
    const explicit = Number(selectedOrder?.order_total ?? NaN)
    if (Number.isFinite(explicit)) return smartPesosFromCents(toCents(explicit))

    const computed = Number(selectedOrder?.total_price ?? 0) + Number(selectedOrder?.shipping_price ?? 0)
    return smartPesosFromCents(toCents(computed))
  }, [selectedOrder?.order_total, selectedOrder?.total_price, selectedOrder?.shipping_price])

  return (
    <section className='w-full md:w-[380px] md:sticky md:top-0 h-fit '>
      <div className='flex flex-col w-full border border-foreground-400 rounded-md  bg-white shadow-md overflow-hidden'>
        {cartItems.length !== 0 && (
          <motion.header
            key='cart-header'
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.2, delay: 0.2, type: 'spring' }}
            className='px-4 py-2 flex items-center justify-between border-b border-foreground-400'
          >
            <h2 className='text-lg'>Resumen del pedido</h2>
            <motion.span className='text-sm text-gray-500'>
              {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
            </motion.span>
          </motion.header>
        )}

        <section className='flex flex-col gap-4 overflow-y-auto   lg:max-h-[40vh]  p-4'>
          <AnimatePresence>
            {cartItems.map((item: CartItem, index: number) => (
              <motion.div
                key={`${item.id}-${item.unitSelected ?? item.unitSelected}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 200 }}
                transition={{ duration: 0.2 }}
              >
                <CartItemBox item={item} isLast={index === cartItems.length - 1} readOnly />
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {cartItems.length !== 0 && (
          <motion.footer
            key='cart-footer'
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.2, delay: 0.3, type: 'spring' }}
            className='flex flex-col shrink-0 p-4 border-t border-foreground-400 bg-white gap-4 overflow-hidden z-10 sticky bottom-0 w-full'
          >
            <div className='flex flex-col justify-between items-center'>
              {/* ✅ Productos con smart round */}
              <div className='text-xl text-right w-full'>
                Productos: <span className='font-bold'>{formatMoney(productsTotalRounded)}</span>
              </div>

              {/* {cartHasDiscount && (
                      <div className='text-right text-2xl w-full'>
                        Descuento: <span className='font-bold'>$0.00</span>
                      </div>
                    )} */}

              {/* Envío con smart round (solo si aplica) */}
              {Number(selectedOrder?.shipping_price ?? 0) !== 0 && (
                <div className='text-xl text-right w-full'>
                  Envío: <span className='font-bold'>{formatMoney(shippingRounded)}</span>
                </div>
              )}

              {/* Total con smart round */}
              <div className='text-xl text-right w-full'>
                Total: <span className='font-bold'>{formatMoney(orderTotalRounded)}</span>
              </div>
            </div>
          </motion.footer>
        )}
      </div>
    </section>
  )
}

export default OrderSummary
