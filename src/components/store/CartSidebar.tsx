import { Button, Input } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { clearCart, selectCartItems, selectCartTotals, type CartItem } from '../../store/slices/cartSlice'
import { setCartOpen } from '../../store/slices/uiSlice'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { repriceCartLine } from '../../store/thunks/cartThunks'
import { formatMoney } from '../../utils/money'
import CartItemBox from './CartItemBox'

type Props = { isOpen: boolean }

const CartSidebar = ({ isOpen }: Props) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { user } = useAppSelector((state) => state.auth)

  // Usamos el carrito “real” (usando el repricing por reglas exclusivas)
  const cartItems = useAppSelector(selectCartItems)
  const { totalPrice: cartTotal } = useAppSelector(selectCartTotals)

  // (Opcional) para refrescar cuando llegan cambios por realtime en productos/promos
  const productsLen = useAppSelector((s) => s.products.items.length)
  const promosLen = useAppSelector((s) => s.promotions.items.length)

  const [showApplyCoupon, setShowApplyCoupon] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(0)

  const toggleApplyCoupon = () => setShowApplyCoupon((v) => !v)

  const emptyCart = () => {
    dispatch(clearCart())
  }

  const scrollToBottom = () => {
    const el = listRef.current
    if (!el) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    })
  }

  const handleCheckout = () => {
    dispatch(setCartOpen(false))
    navigate('/tienda/checkout')
  }

  // Firma estable (NO incluye price para evitar loops)
  const cartSig = cartItems.map((it) => `${it.id}:${it.unitSelected ?? it.base_unit ?? ''}:${it.quantity ?? 0}`).join('|')

  // Reprice masivo al abrir, al cambiar qty/unit, o al cambiar productos/promos
  useEffect(() => {
    if (!isOpen) return
    if (cartItems.length === 0) return

    for (const it of cartItems) {
      const unitKey = (it.unitSelected ?? it.base_unit ?? '') as string
      dispatch(
        repriceCartLine({
          id: it.id,
          prevUnitSelected: it.unitSelected ?? it.base_unit ?? null,
          nextUnit: unitKey,
          nextQuantity: it.quantity ?? 1
        })
      )
    }
  }, [isOpen, cartSig, productsLen, promosLen, dispatch])

  // scroll al agregar items
  useEffect(() => {
    if (!isOpen) return
    if (cartItems.length > prevCount.current) {
      scrollToBottom()
    }
    prevCount.current = cartItems.length
  }, [cartItems.length, isOpen])

  return (
    <aside className='flex flex-col h-full relative overflow-hidden'>
      <AnimatePresence>
        {cartItems.length !== 0 && (
          <motion.header
            key='cart-header'
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.2, delay: 0.2, type: 'spring' }}
            className='px-4 py-2 flex items-center justify-between border-b border-foreground-400'
          >
            <h2 className='text-lg '>Carrito de compras</h2>
            <Button variant='light' onPress={emptyCart} color='danger'>
              Vaciar carrito
            </Button>
          </motion.header>
        )}

        <section ref={listRef} className='flex-grow flex flex-col gap-4 overflow-y-auto overflow-x-hidden p-4'>
          {cartItems.length === 0 && (
            <div className='text-center h-full flex flex-col items-center justify-center gap-2 p-4 '>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
              >
                <img src='/errors/empty-cart.webp' alt='' />
                <h4 className='text-xl font-bold'>No hay nada aquí</h4>
                <p className='text-gray-500 text-sm text-balance'>
                  Houston... tenemos un carrito vacío. Agrega algo para comenzar el viaje.
                </p>
                <Button className='bg-black text-white mt-2' onPress={() => navigate('/tienda/productos')}>
                  Ver productos
                </Button>
              </motion.div>
            </div>
          )}

          {cartItems.map((item: CartItem, index: number) => (
            <div key={`${item.id}-${item.unitSelected ?? item.base_unit}-${index}`}>
              <CartItemBox item={item as any} isLast={index === cartItems.length - 1} listRef={listRef} />
            </div>
          ))}
        </section>

        {cartItems.length !== 0 && (
          <motion.footer
            key='cart-footer'
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.2, delay: 0.3, type: 'spring' }}
            className='flex flex-col shrink-0 p-4 border-t border-foreground-400 bg-white gap-4 overflow-hidden z-10'
          >
            {showApplyCoupon && (
              <motion.section
                className='flex items-center gap-2'
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, type: 'spring' }}
              >
                <div className='flex flex-grow '>
                  <Input
                    label='Código de descuento'
                    size='sm'
                    classNames={{ inputWrapper: 'rounded-r-none border-black' }}
                    variant='bordered'
                  />
                  <Button size='lg' className='rounded-l-none bg-black text-white' variant='solid'>
                    Aplicar
                  </Button>
                </div>

                <Button size='lg' variant='solid' isIconOnly color='danger' onPress={toggleApplyCoupon}>
                  <X />
                </Button>
              </motion.section>
            )}

            {/* {cartHasDiscount && (
              <div className='text-right text-sm'>
                Subtotal: <span className='font-semibold'>{formatMoney(cartSubtotal)}</span>
                <br />
                Descuento: <span className='font-bold text-success-600'>-{formatMoney(cartDiscount)}</span>
              </div>
            )} */}

            <div className='flex justify-between items-center'>
              <div>
                {!showApplyCoupon && user?.role === 'customer' && (
                  <motion.span
                    onClick={toggleApplyCoupon}
                    className='cursor-pointer text-sm'
                    whileHover={{ textDecoration: 'underline' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    ¿Tienes un cupón?
                  </motion.span>
                )}
              </div>
              <div className='text-2xl text-right'>
                Total : <span className='font-bold'>{formatMoney(cartTotal)}</span>
              </div>
            </div>

            <Button
              className='border-2 border-black bg-white hover:bg-black hover:text-white hover:!opacity-100 data-[hover=true]:opacity-100'
              onPress={handleCheckout}
            >
              <CircleCheck />
              Iniciar pedido
            </Button>
          </motion.footer>
        )}
      </AnimatePresence>
    </aside>
  )
}

export default CartSidebar
