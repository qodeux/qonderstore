import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { clearError, removeItem, type CartItem } from '../../store/slices/cartSlice'
import { useAppDispatch } from '../../store/store'
import { repriceCartLine } from '../../store/thunks/cartThunks'
import { bulkUnitsAvailable, type BulkUnit } from '../../types/products'
import { all_units } from '../../types/storeOrders'
import { formatMoney } from '../../utils/money'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'
import QuantitySelector from './QuantitySelector'
import UnitSelector from './UnitSelector'

type CartItemBoxProps = {
  item: CartItem & {
    // estos campos pueden venir del selector selectCartWithPromos
    subtotalBase?: number
    finalSubtotal?: number
    totalDiscount?: number
    discountPercent?: number
  }
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
  const dispatch = useAppDispatch()

  // ========= CÁLCULOS DE PRECIO / DESCUENTO / SUBTOTAL =========
  const quantity = item.quantity ?? 0

  const unitRetailPrice = item.basePrice ?? item.price // referencia (normal)
  const unitFinalPrice = item.price // lo que se cobra

  const unitDiscount = Math.max(0, unitRetailPrice - unitFinalPrice)
  const lineDiscount = unitDiscount * quantity

  const lineSubtotal = unitFinalPrice * quantity

  // const discountPercent = unitRetailPrice > 0 ? Math.round((unitDiscount / unitRetailPrice) * 100) : 0
  // const sourceLabel = item.pricingSource === 'wholesale' ? 'Mayoreo' : item.pricingSource === 'promo' ? 'Promo' : null

  // error local para cosas como "Cantidad máxima alcanzada"
  const [localError, setLocalError] = useState<string | null>(null)

  const handleDeleteItem = () =>
    dispatch(
      removeItem({
        id: item.id,
        unitSelected: item.unitSelected ?? item.base_unit
      })
    )

  const handleChangeQty = (q: number) => {
    dispatch(
      repriceCartLine({
        id: item.id,
        prevUnitSelected: item.unitSelected ?? item.base_unit ?? null,
        nextUnit: (item.unitSelected ?? item.base_unit ?? '') as string,
        nextQuantity: q
      })
    )
  }

  const handleChangeUnit = (u: string) => {
    dispatch(
      repriceCartLine({
        id: item.id,
        prevUnitSelected: item.unitSelected ?? item.base_unit ?? null,
        nextUnit: u
      })
    )
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

  // error combinado: preferimos el local si existe
  const errorMessage = localError ?? item.error ?? null

  // Limpia el error 2s después de aparecer (tanto Redux como local)
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
    // stock en gramos → convertir a la unidad del item (gr/oz/lb)
    const unitKey = (item.unitSelected ?? item.base_unit ?? null) as BulkUnit | null
    const gramsPerUnit = getBulkUnitFactorInGrams(unitKey)
    if (rawStock <= 0 || gramsPerUnit <= 0) maxQuantity = 0
    else maxQuantity = Math.floor(rawStock / gramsPerUnit)
  } else {
    // unit: stock interpretado como número de piezas
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
                {item.quantity}{' '}
                {item.quantity === 1
                  ? all_units.find((u) => u.key === item.unitSelected)?.label || ''
                  : all_units.find((u) => u.key === item.unitSelected)?.plural || ''}
              </p>
            )}

            <p>Precio: {formatMoney(unitRetailPrice)}</p>

            {lineDiscount > 0 && (
              <div className='text-green-600'>
                Descuento: -{formatMoney(lineDiscount)}
                {/* {discountPercent > 0 ? `(${discountPercent}%)` : ''}
                {sourceLabel ? ` • ${sourceLabel}` : ''} */}
              </div>
            )}

            <p className='text-lg'>Subtotal: {formatMoney(lineSubtotal ?? 0)}</p>
          </div>
        </section>
      </div>

      {!readOnly && (
        <section className='flex gap-2 justify-between'>
          <QuantitySelector quantity={item.quantity} setQuantity={handleChangeQty} maxQuantity={maxQuantity} onError={setLocalError} />

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
