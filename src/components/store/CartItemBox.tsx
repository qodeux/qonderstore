import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { clearError, removeItem, updateQuantity, updateUnit, type CartItem } from '../../store/slices/cartSlice'
import { all_units } from '../../types/storeOrders'
import { formatMoney } from '../../utils/money'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'
import QuantitySelector from './QuantitySelector'
import UnitSelector from './UnitSelector'

type CartItemBoxProps = {
  item: CartItem
  listRef?: React.RefObject<HTMLDivElement | null>
  isLast?: boolean
  readOnly?: boolean
}

const CartItemBox = ({ item, isLast, listRef, readOnly }: CartItemBoxProps) => {
  const dispatch = useDispatch()
  const subtotal = readOnly ? item.price - (item.discount ?? 0) : item.price * item.quantity - (item.discount ?? 0)

  const handleDeleteItem = () => dispatch(removeItem({ id: item.id }))
  const handleChangeQty = (q: number) => dispatch(updateQuantity({ id: item.id, quantity: q }))

  const handleChangeUnit = (u: string) => {
    // Si el item ya trae item.units, no necesitas pasar unitsMap
    dispatch(updateUnit({ id: item.id, unit: u, unitsMap: item.units }))
  }

  const scrollToBottom = useCallback(() => {
    const el = listRef?.current
    if (!el) return
    // Espera al layout/animación de Framer antes de scrollear
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    })
  }, [listRef])

  // Limpia el error 3 segundos después de aparecer
  useEffect(() => {
    if (item.error) {
      if (isLast) {
        scrollToBottom()
      }

      const timer = setTimeout(() => {
        dispatch(clearError({ id: item.id }))
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [item.error, item.id, dispatch, isLast, scrollToBottom])

  return (
    <article className='flex flex-col gap-4'>
      <div className='flex gap-4 '>
        <figure className='aspect-square w-1/3 bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 text-xs rounded-xl overflow-hidden'>
          {item.image ? <PresignedImage keyPath={item.image} expires={300} /> : 'Sin imagen'}
        </figure>
        <section className='flex flex-col w-2/3 justify-between'>
          <h3 className='md:text-lg font-semibold'>{item.title}</h3>
          <div className='text-gray-600 text-right text-sm'>
            {readOnly && (
              <p>
                {item.quantity}{' '}
                {item.quantity === 1
                  ? all_units.find((u) => u.key === item.unitSelected)?.label || ''
                  : all_units.find((u) => u.key === item.unitSelected)?.plural || ''}
              </p>
            )}
            <p>Precio: {formatMoney(item.price)}</p>
            {(item.discount ?? 0) > 0 && <div className='text-green-600'>Descuento: -{formatMoney(item.discount ?? 0)}</div>}
            <p className='text-lg '>Subtotal: {formatMoney(subtotal)}</p>
          </div>
        </section>
      </div>

      {!readOnly && (
        <section className='flex gap-2 justify-between'>
          {/* Forzamos al error si el quantity es mayor al stock */}
          <QuantitySelector quantity={item.quantity} setQuantity={handleChangeQty} maxQuantity={item.stock ? item.stock + 1 : 1} />
          {item.saleType === 'bulk' && (
            <UnitSelector
              quantity={item.quantity}
              baseUnit={item.base_unit ?? ''}
              units={item.units}
              value={item.unitSelected ?? item.base_unit}
              onChange={handleChangeUnit}
            />
          )}
          <Button isIconOnly size='lg' color='danger' variant='ghost' onPress={handleDeleteItem}>
            <Trash />
          </Button>
        </section>
      )}

      <AnimatePresence>
        {item.error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 30 }}
            className='text-sm text-danger animate-fade-in'
          >
            {item.error}
          </motion.p>
        )}
      </AnimatePresence>
    </article>
  )
}

export default CartItemBox
