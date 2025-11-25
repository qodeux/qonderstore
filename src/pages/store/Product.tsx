import { Button, Chip, Progress, Tooltip } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import '@smastrom/react-rating/style.css'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, HeartMinus, HeartPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router'
import { SwiperSlide } from 'swiper/react'

import ProductLightboxGallery from '../../components/common/light-box/ProductLightbox'
import SwipperSlider from '../../components/common/swiper/SwipperSlider'
import ProductItem from '../../components/store/ProductItem'
import QuantitySelector from '../../components/store/QuantitySelector'
import UnitSelector from '../../components/store/UnitSelector'
import { userService } from '../../services/userService'
import { makeSelectProductWithPromoBySlug, selectProductsWithBestPromo } from '../../store/selectors/productsWithPromo'
import { addItem } from '../../store/slices/cartSlice'
import { setCartOpen } from '../../store/slices/uiSlice'
import type { RootState } from '../../store/store'
import { bulkUnitsAvailable, saleUnitsAvailable, type BulkUnit } from '../../types/products'
import { formatMoney } from '../../utils/money'

//eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

const Product = () => {
  const { slug } = useParams()
  const { user, favs } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  const categories = useSelector((state: RootState) => state.categories.items)
  const brands = useSelector((state: RootState) => state.products.brands)
  const selectBySlug = makeSelectProductWithPromoBySlug(slug ?? '')
  const product = useSelector(selectBySlug)
  const products = useSelector(selectProductsWithBestPromo).filter((p) => p.is_active)
  const cartItems = useSelector((s: RootState) => s.cart.items)

  const isFav = favs.some((fav) => fav.product_id === product?.id)

  const rating = 4
  const [quantity, setQuantity] = useState(product?.min_sale ? product.min_sale : 1)
  const [stockLeftPercent, setStockLeftPercent] = useState<number | null>(null)
  const [QuantityError, setQuantityError] = useState<string | null>(null)

  // ---------- IMÁGENES ----------
  const images = useMemo(() => product?.images ?? [], [product?.images])
  const mainImage = product?.main_image ?? null
  const orderedImages = useMemo(() => (mainImage ? [mainImage, ...images.filter((img) => img !== mainImage)] : images), [images, mainImage])

  // ---------- UNIDADES & PRECIOS ----------
  const unitKeys = useMemo(() => Object.keys(product?.units ?? {}), [product?.units])
  const defaultUnit = (product?.base_unit as string) || unitKeys[0] || null
  const [unitSelected, setUnitSelected] = useState<string | null>(defaultUnit)

  useEffect(() => {
    const nextDefault = (product?.base_unit as string) || (Object.keys(product?.units ?? {})[0] ?? null)
    setUnitSelected((prev) => prev ?? nextDefault)
  }, [product?.base_unit, product?.units])

  const baseFinalPrice = Number(product?.finalPrice ?? product?.price ?? 0)
  const baseOriginalPrice = Number(product?.price ?? 0)

  const resolveUnitPriceFrom = (base: number, unitKey: string | null): number => {
    if (!unitKey || !product) return Math.ceil(base)
    const u = (product as AnyRecord).units?.[unitKey]
    if (u == null) return Math.ceil(base)
    if (typeof u === 'number') return Math.ceil(Number(u))
    const p = Number(u?.price)
    const f = Number(u?.factor)
    if (Number.isFinite(p)) return Math.ceil(p)
    if (Number.isFinite(f)) return Math.ceil(base * f)
    return Math.ceil(base)
  }

  const unitPrice = useMemo(() => resolveUnitPriceFrom(baseFinalPrice, unitSelected), [baseFinalPrice, unitSelected])
  const unitOriginalPrice = useMemo(() => resolveUnitPriceFrom(baseOriginalPrice, unitSelected), [baseOriginalPrice, unitSelected])

  const hasPromo = Boolean(product?.hasPromotion) && unitOriginalPrice > unitPrice
  const total = useMemo(() => unitPrice * quantity, [unitPrice, quantity])

  // ---------- HELPERS INVENTARIO (BULK) ----------
  // bulkUnitsAvailable:
  // { label: 'Gramo', key: 'gr', value: 1 }
  // { label: 'Onza',  key: 'oz', value: 28.3495 }
  // { label: 'Libra', key: 'lb', value: 453.592 }
  const getBulkUnitFactorInGrams = (unitKey: BulkUnit | null): number => {
    if (!unitKey) return 1
    const found = bulkUnitsAvailable.find((u) => u.key === unitKey)
    return found?.value ?? 1
  }

  // ---------- DISPONIBILIDAD / STOCK ----------
  // stockTotalBase:
  // - unit  → interpretamos como unidades
  // - bulk  → interpretamos como gramos
  const stockTotalBase = Number(product?.stock ?? 0)

  const reservedInCartBase = useMemo(() => {
    if (!product) return 0

    // Productos por pieza: stock en unidades
    if (product.sale_type === 'unit') {
      return cartItems.filter((it) => it.id === product.id).reduce((sum, it) => sum + (it.quantity || 0), 0)
    }

    // Productos a granel: stock en gramos
    return cartItems
      .filter((it) => it.id === product.id)
      .reduce((sum, it) => {
        const unitKey = (it.unitSelected ?? it.base_unit ?? null) as BulkUnit | null
        const gramsPerUnit = getBulkUnitFactorInGrams(unitKey)
        return sum + (it.quantity || 0) * gramsPerUnit
      }, 0)
  }, [cartItems, product])

  const remainingNowBase = Math.max(0, stockTotalBase - reservedInCartBase)

  // factor de la unidad actual (solo importa para bulk)
  const currentFactorGrams = useMemo(() => {
    if (!product || product.sale_type !== 'bulk') return 1
    const unitKey = (unitSelected ?? product.base_unit ?? null) as BulkUnit | null
    return getBulkUnitFactorInGrams(unitKey)
  }, [product, unitSelected])

  const maxSelectableQty = useMemo(() => {
    if (!product) return 0

    if (product.sale_type === 'unit') {
      // stock y reservado en unidades
      return remainingNowBase
    }

    // bulk → stock/ reservado en gramos → convertimos a la unidad actual
    const safeFactor = Number.isFinite(currentFactorGrams) && currentFactorGrams > 0 ? currentFactorGrams : 1
    return Math.max(0, Math.floor(remainingNowBase / safeFactor))
  }, [product, remainingNowBase, currentFactorGrams])

  // Para no tocar demasiado el resto del componente
  const remainingNow = remainingNowBase

  useEffect(() => {
    if (product?.stock == null) {
      setStockLeftPercent(null)
      return
    }
    const percent = stockTotalBase > 0 ? Math.round((remainingNowBase / stockTotalBase) * 100) : 0
    setStockLeftPercent(percent)
  }, [product?.stock, stockTotalBase, remainingNowBase])

  // Mantener quantity dentro del rango válido cuando cambian stock / unidad / carrito
  useEffect(() => {
    const safeMax = Number.isFinite(maxSelectableQty) ? maxSelectableQty : 0
    setQuantity((q) => {
      if (safeMax === 0) return 0
      const min = product?.min_sale && product.min_sale > 0 ? product.min_sale : 1
      if (q < min) return min
      if (q > safeMax) return safeMax
      return q
    })
  }, [maxSelectableQty, product?.min_sale])

  // ---------- RELACIONADOS ----------
  const relatedProducts = useMemo(() => {
    if (!product) return []
    return products
      .filter((p) => p.id !== product.id)
      .slice()
      .sort((a, b) => a.id - b.id)
      .slice(0, 8)
  }, [products, product])

  // ---------- CARRITO ----------
  const handleAddToCart = () => {
    if (!product) return
    if (quantity > maxSelectableQty || maxSelectableQty === 0) {
      setQuantityError('No hay existencias suficientes')
      return
    }

    const unitKey = unitSelected ?? product.base_unit
    dispatch(
      addItem({
        id: product.id,
        title: product.name,
        image: product.main_image ?? orderedImages[0],
        saleType: product.sale_type,
        units: product.units,
        base_unit: product.base_unit,
        unitSelected: unitKey ?? undefined,
        basePrice: Number(product.price ?? 0),
        price: unitPrice,
        discount: 0,
        quantity,
        stock: Number(product.stock ?? Number.POSITIVE_INFINITY)
      })
    )
    dispatch(setCartOpen(true))
  }

  // ---------- FAVORITOS ----------
  const handleAddtoFavs = async () => {
    if (!product) return
    try {
      await userService.addProductFav({
        product_id: product.id
      })
    } catch (error) {
      console.error('Error adding product to favorites:', error)
    }
  }
  const handleRemovefromFavs = async () => {
    if (!user || !product) return
    try {
      await userService.removeProductFav({
        product_id: product.id,
        user_id: user.id
      })
    } catch (error) {
      console.error('Error removing product from favorites:', error)
    }
  }

  useEffect(() => {
    if (!QuantityError) return
    const timer = setTimeout(() => setQuantityError(null), 2000)
    return () => clearTimeout(timer)
  }, [QuantityError])

  useEffect(() => {
    if (!product) return
    document.title = `${product?.name} - Qonderstore`
  }, [product])

  if (!product) return <div>Producto no encontrado</div>

  const canAdd = maxSelectableQty > 0 && quantity >= 1 && quantity <= maxSelectableQty

  const progressColor = (stockLeftPercent ?? 0) <= 10 ? 'danger' : (stockLeftPercent ?? 0) <= 50 ? 'warning' : 'success'

  const saleUnitsAvailableLabel = saleUnitsAvailable.find((u) => u.key === product.unit)?.label ?? ''

  return (
    <>
      <section className='container flex flex-col md:flex-row gap-8 mx-auto px-8 mt-8'>
        {/* === GALERÍA === */}
        <div className='w-full md:w-1/2 rounded-xl overflow-hidden border border-neutral-300'>
          <ProductLightboxGallery mainImage={product.main_image} images={orderedImages} showThumbnails maxWidth={900} />
        </div>

        {/* === DETALLES === */}
        <div className='w-full md:w-1/2 space-y-4'>
          <header>
            <div className='flex items-center gap-2'>
              <div className='flex flex-col'>
                <span className='text-lg'>{product.category}</span>
              </div>
              {product.subcategory && (
                <>
                  <ChevronRight size={16} />
                  <div className='flex flex-col'>
                    <span className='text-lg'>{categories.find((cat) => cat.id === Number(product.subcategory))?.name}</span>
                  </div>
                </>
              )}
            </div>

            <div className='flex items-center justify-between'>
              <h2 className='text-3xl md:text-4xl font-bold'>{product.name}</h2>
              {isFav ? (
                <motion.div
                  key={product.id + 'fav'}
                  initial={{ scale: 0 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  exit={{ opacity: 0 }}
                >
                  <Tooltip content='Quitar de favoritos' placement='left'>
                    <Button isIconOnly className='' variant='solid' color='danger' size='sm' onPress={handleRemovefromFavs}>
                      <HeartMinus />
                    </Button>
                  </Tooltip>
                </motion.div>
              ) : (
                <motion.div
                  key={product.id + 'Notfav'}
                  initial={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  exit={{ opacity: 0 }}
                >
                  <Tooltip content='Agregar a favoritos' placement='left'>
                    <Button isIconOnly className='' variant='ghost' color='danger' size='sm' onPress={handleAddtoFavs}>
                      <HeartPlus />
                    </Button>
                  </Tooltip>
                </motion.div>
              )}
            </div>

            {product.brand && (
              <div className='flex flex-col'>
                <span className='text-xl font-medium'>{brands.find((b) => b.id === product.brand)?.name}</span>
                <span className='text-xs font-medium'>Marca</span>
              </div>
            )}
          </header>

          {/* === STOCK === */}
          <div className='flex items-center gap-8 justify-between'>
            <div className='flex flex-col max-w-1/2 md:max-w-1/3'>
              <Rating className='pr-5' value={rating} />
              <span>Opiniones (999)</span>
            </div>

            {(product.stock ?? 0) > 0 ? (
              <Progress
                aria-label='Disponibilidad'
                label={Number(remainingNow.toFixed(0)) === 0 ? '' : `Queda${Number(remainingNow.toFixed(0)) > 1 ? 'n' : ''}`}
                size='md'
                value={stockLeftPercent ?? 0}
                showValueLabel
                className='w-full max-w-1/2 md:max-w-2/3 lg:max-w-1/2 xl:max-w-1/3'
                valueLabel={
                  Number(remainingNow.toFixed(0)) === 0
                    ? 'Agotado'
                    : product.sale_type === 'unit'
                      ? `${remainingNow} ${saleUnitsAvailableLabel}${remainingNow > 1 ? 's' : ''}`
                      : remainingNow > 999
                        ? `${(remainingNow / 1000).toFixed(2)} kg`
                        : `${remainingNow.toFixed(0)} gr${Number(remainingNow.toFixed(0)) > 1 ? 's' : ''}`
                }
                color={progressColor}
              />
            ) : (
              <span className='text-danger font-semibold'>Producto agotado</span>
            )}
          </div>

          <p>{product.description}</p>

          {/* === PRECIOS === */}
          <div className='flex items-center justify-between'>
            <div className='flex flex-col'>
              <div className='flex items-baseline gap-3'>
                <span className='text-3xl font-bold'>{formatMoney(unitPrice)}</span>
                {hasPromo && <span className='text-lg line-through text-neutral-500'>{formatMoney(unitOriginalPrice)}</span>}
              </div>
              {hasPromo ? (
                <div>
                  Precio con descuento{' '}
                  <Chip color='success' variant='flat' size='sm' className='font-medium'>
                    <span>{product.discountPercent ? `-${product.discountPercent.toFixed(0)}%` : `$${product.discountAmount}`}</span>
                  </Chip>
                </div>
              ) : (
                <span>Precio normal</span>
              )}
            </div>

            {quantity > 1 && (
              <div className='flex flex-col'>
                <span className='text-3xl font-bold'>{formatMoney(total)}</span>
                <span className='text-right'>Total</span>
              </div>
            )}
          </div>

          {(product.stock ?? 0) > 0 && (
            <>
              <section className='flex flex-col lg:flex-row gap-6 md:gap-2'>
                <div className='flex items-center gap-2 w-full'>
                  <AnimatePresence>
                    {remainingNow > 0 && (
                      <motion.div
                        key='qty-selector'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <QuantitySelector
                          quantity={quantity}
                          setQuantity={(q) => {
                            const safeMax = Number.isFinite(maxSelectableQty) ? maxSelectableQty : 0
                            const minAllowed = product.min_sale && product.min_sale > 0 ? product.min_sale : safeMax > 0 ? 1 : 0
                            const next = Math.max(minAllowed, Math.min(q, safeMax))
                            setQuantity(next)
                            if (q > safeMax) setQuantityError('No hay existencias suficientes')
                          }}
                          maxQuantity={maxSelectableQty}
                          minQuantity={product.min_sale}
                          onError={setQuantityError}
                        />
                      </motion.div>
                    )}

                    {product.sale_type === 'unit' && remainingNow > 0 && (
                      <motion.div
                        key='unit-label'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <span className='font-medium text-lg'>
                          {saleUnitsAvailable.find((unit) => unit.key === product.unit)?.label}
                          {quantity && quantity > 1 && 's'}
                        </span>
                      </motion.div>
                    )}

                    {product.sale_type === 'bulk' && remainingNow > 0 && (
                      <motion.div
                        key='unit-selector'
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        className='w-full'
                      >
                        <UnitSelector
                          quantity={quantity}
                          baseUnit={product.base_unit ?? ''}
                          units={product.units}
                          value={unitSelected ?? product.base_unit ?? unitKeys[0] ?? ''}
                          onChange={setUnitSelected}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button className='bg-black text-white hover:bg-neutral-800' size='lg' onPress={handleAddToCart} isDisabled={!canAdd}>
                  Agregar
                </Button>
              </section>
              <AnimatePresence>
                {QuantityError && (
                  <motion.section
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, type: 'spring', stiffness: 500, damping: 30 }}
                    className='mt-2 text-sm text-danger font-medium'
                  >
                    {QuantityError}
                  </motion.section>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </section>

      {/* === RELACIONADOS === */}
      <section className='my-8 container mx-auto px-8'>
        <header className='mb-4'>
          <h3 className='text-2xl font-semibold'>Productos relacionados</h3>
        </header>
        <SwipperSlider showProgress showNavigation showPagination autoplay={10000}>
          {relatedProducts
            .filter((p) => p.featured === true)
            .map((item) => (
              <SwiperSlide key={`related-${item.id}`}>
                <ProductItem key={item.id} item={item} isRelated />
              </SwiperSlide>
            ))}
        </SwipperSlider>
      </section>
    </>
  )
}

export default Product
