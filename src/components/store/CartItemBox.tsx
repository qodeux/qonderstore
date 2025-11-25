import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { clearError, removeItem, updateQuantity, updateUnit, type CartItem } from '../../store/slices/cartSlice'
import { bulkUnitsAvailable, type BulkUnit } from '../../types/products'
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

// helper: gramos por unidad para bulk
const getBulkUnitFactorInGrams = (unitKey: BulkUnit | null): number => {
  if (!unitKey) return 1
  const found = bulkUnitsAvailable.find((u) => u.key === unitKey)
  return found?.value ?? 1
}

const CartItemBox = ({ item, isLast, listRef, readOnly }: CartItemBoxProps) => {
  const dispatch = useDispatch()

  // ========= PRECIOS / DESCUENTOS =========

  const quantity = item.quantity ?? 1

  // Campos "enriquecidos" que SOLO existen en OrderDetails
  const enriched = item as CartItem & {
    subtotalBase?: number
    finalSubtotal?: number
    totalDiscount?: number
    discountPercent?: number
  }

  // MODO READONLY (OrderDetails): usamos lo que viene de la orden
  const hasEnriched = readOnly && enriched.finalSubtotal != null

  // Precio unitario a mostrar
  const effectiveUnitPrice = hasEnriched ? (enriched.subtotalBase ?? enriched.finalSubtotal!) / (quantity || 1) : item.price

  // Descuento total de la línea (solo en readOnly si viene)
  const effectiveLineDiscount = hasEnriched ? (enriched.totalDiscount ?? 0) : (item.discount ?? 0) * quantity

  // Subtotal final de la línea
  const effectiveSubtotal = hasEnriched ? enriched.finalSubtotal! : Math.max(0, item.price * quantity - (item.discount ?? 0) * quantity)

  // ========= ERROR LOCAL =========
  const [localError, setLocalError] = useState<string | null>(null)
  const errorMessage = localError ?? item.error ?? null

  const handleDeleteItem = () =>
    dispatch(
      removeItem({
        id: item.id,
        unitSelected: item.unitSelected ?? item.base_unit
      })
    )

  const handleChangeQty = (q: number) =>
    dispatch(
      updateQuantity({
        id: item.id,
        unitSelected: item.unitSelected ?? item.base_unit,
        quantity: q
      })
    )

  const handleChangeUnit = (u: string) => {
    // 👇 En el carrito real, esto sigue igual; updateUnit recalcule item.price según unitsMap
    dispatch(updateUnit({ id: item.id, unit: u, unitsMap: item.units }))
  }

  const scrollToBottom = useCallback(() => {
    const el = listRef?.current
    if (!el) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    })
  }, [listRef])

  useEffect(() => {
    if (!errorMessage) return

    if (isLast) {
      scrollToBottom()
    }

    const timer = setTimeout(() => {
      if (item.error) {
        dispatch(clearError({ id: item.id }))
      }
      if (localError) {
        setLocalError(null)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [errorMessage, item.error, item.id, dispatch, isLast, scrollToBottom, localError])

  // ====== MAX QUANTITY SEGÚN TIPO ======
  const rawStock = Number(item.stock ?? 0)
  let maxQuantity: number

  if (item.saleType === 'bulk') {
    const unitKey = (item.unitSelected ?? item.base_unit ?? null) as BulkUnit | null
    const gramsPerUnit = getBulkUnitFactorInGrams(unitKey)
    if (rawStock <= 0 || gramsPerUnit <= 0) maxQuantity = 0
    else maxQuantity = Math.floor(rawStock / gramsPerUnit)
  } else {
    maxQuantity = rawStock > 0 ? rawStock : item.quantity || 1
  }

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
                {quantity}{' '}
                {quantity === 1
                  ? all_units.find((u) => u.key === item.unitSelected)?.label || ''
                  : all_units.find((u) => u.key === item.unitSelected)?.plural || ''}
              </p>
            )}

            {/* 👇 Precio unitario mostrado */}
            <p>Precio: {formatMoney(effectiveUnitPrice)}</p>

            {/* 👇 Descuento total de la línea (si existe) */}
            {effectiveLineDiscount > 0 && <div className='text-green-600'>Descuento: -{formatMoney(effectiveLineDiscount)}</div>}

            {/* 👇 Subtotal final de la línea */}
            <p className='text-lg '>Subtotal: {formatMoney(effectiveSubtotal)}</p>
          </div>
        </section>
      </div>

      {!readOnly && (
        <section className='flex gap-2 justify-between'>
          <QuantitySelector quantity={quantity} setQuantity={handleChangeQty} maxQuantity={maxQuantity} onError={setLocalError} />

          {item.saleType === 'bulk' && (
            <UnitSelector
              quantity={quantity}
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
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 30 }}
            className='text-sm text-danger animate-fade-in'
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </article>
  )
}

export default CartItemBox
