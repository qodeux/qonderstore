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
import { fromCents, smartPesosFromCents, toCents } from '../../utils/pricing'
import PresignedImage from '../common/cloudflare-r2/PresignedImage'
import QuantitySelector from './QuantitySelector'
import UnitSelector from './UnitSelector'

type CartItemBoxProps = {
  item: CartItem & {
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

  // ========= CÁLCULOS (SIN FLOATS) =========
  const quantity = Math.max(0, item.quantity ?? 0)

  // referencia (retail) vs final (lo que se cobra)
  const unitRetailPrice = item.basePrice ?? item.price
  const unitFinalPrice = item.price

  // centavos unitarios
  const retailUnitC = toCents(unitRetailPrice)
  const finalUnitC = toCents(unitFinalPrice)

  // centavos por línea
  const retailLineC = retailUnitC * quantity
  const finalLineC = finalUnitC * quantity

  // descuento en centavos (solo para mostrar)
  const lineDiscountC = Math.max(0, retailLineC - finalLineC)
  const lineDiscountPesos = Math.floor(lineDiscountC / 100) // regla: descuento sin centavos

  // subtotal final (con regla smart)
  const lineSubtotalPesos = smartPesosFromCents(finalLineC)

  // valores “bonitos” para el caso readOnly (precio x qty)
  const retailLine = fromCents(retailLineC)

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

  const errorMessage = localError ?? item.error ?? null

  useEffect(() => {
    if (!errorMessage) return

    if (isLast) scrollToBottom()

    const timer = setTimeout(() => {
      if (item.error) dispatch(clearError({ id: item.id }))
      if (localError) setLocalError(null)
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
      <div className='flex gap-4'>
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

            {/* Precio: unitario (normal), o por línea (readOnly) */}
            <p>Precio: {readOnly ? formatMoney(retailLine) : formatMoney(unitRetailPrice)}</p>

            {/* Descuento mostrado sin centavos */}
            {lineDiscountPesos > 0 && <div className='text-green-600'>Descuento: -{formatMoney(lineDiscountPesos)}</div>}

            {/* Subtotal final con regla smart */}
            <p className='text-lg'>Subtotal: {formatMoney(lineSubtotalPesos)}</p>
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
