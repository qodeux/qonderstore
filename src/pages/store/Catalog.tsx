// pages/Catalog.tsx
import { Button, Chip, Input } from '@heroui/react'
import { AnimatePresence, LazyMotion, domAnimation, m as motion, type Transition } from 'framer-motion'
import { LayoutGrid, List } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import OrderBy from '../../components/store/OrderBy'
import ProductItem from '../../components/store/ProductItem'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { selectCatalogFilters, selectVisibleProducts } from '../../store/selectors/catalogSelectors'
import { clearBrandIds, clearCategorySlugs, clearTypes, setPriceRange, setQuery } from '../../store/slices/productFiltersSlice'
import type { RootState } from '../../store/store'

// Animación tipo resorte para movimientos de layout
const spring: Transition = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }

// Variants para entrada/salida de items
const itemVariants = {
  initial: { opacity: 0, scale: 0.9, filter: 'blur(2px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.18 } },
  exit: { opacity: 0, scale: 0.9, filter: 'blur(2px)', transition: { duration: 0.18 } }
}

// (Opcional) stagger suave al entrar nuevos items
const containerVariants = {
  animate: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } }
}

const Catalog = () => {
  const dispatch = useDispatch()
  const filters = useSelector(selectCatalogFilters)
  const products = useSelector(selectVisibleProducts).filter((p) => p.is_active)
  const { types, categorySlugs, brandIds, priceMax, priceMin } = useSelector((state: RootState) => state.productFilters)

  const debouncedQuery = useDebouncedSearch((val: string) => dispatch(setQuery(val)), 300)

  return (
    <section className='w-full flex flex-col md:flex-row text-neutral-900'>
      <section className='flex-1 container mx-auto w-full '>
        <div className='text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 rounded-lg bg-white shadow-lg sticky top-4 z-20 mb-6'>
          <div className='hidden sm:flex flex-wrap items-center gap-2'>
            {types.length > 0 || categorySlugs.length > 0 || brandIds.length > 0 || priceMin !== null || priceMax !== null ? (
              <div className='flex flex-col text-xs gap-1'>
                Filtrado por:
                <div className='flex items-center gap-2'>
                  {types.length >= 1 && (
                    <Chip variant='bordered' onClose={() => dispatch(clearTypes())} color='success'>
                      {types.length >= 2 ? 'Tipos' : 'Tipo'}
                    </Chip>
                  )}
                  {(priceMin !== null || priceMax !== null) && (
                    <Chip variant='bordered' onClose={() => dispatch(setPriceRange({ min: null, max: null }))} color='primary'>
                      Precio
                    </Chip>
                  )}
                  {categorySlugs.length >= 1 && (
                    <Chip variant='bordered' onClose={() => dispatch(clearCategorySlugs())} color='secondary'>
                      {categorySlugs.length >= 2 ? 'Categorías' : 'Categoría'}
                    </Chip>
                  )}

                  {brandIds.length >= 1 && (
                    <Chip variant='bordered' onClose={() => dispatch(clearBrandIds())} color='danger'>
                      {brandIds.length >= 2 ? 'Marcas' : 'Marca'}
                    </Chip>
                  )}
                </div>
              </div>
            ) : (
              <span className='text-lg pl-2  font-bold'>Catálogo de productos</span>
            )}
          </div>

          <div className='flex items-center gap-2 flex-col sm:flex-row sm:min-w-lg '>
            <Input
              size='sm'
              radius='sm'
              className='text-sm'
              label='Buscar productos'
              isClearable
              variant='bordered'
              classNames={{ inputWrapper: 'border-gray-300' }}
              defaultValue={filters.query}
              onValueChange={(v) => debouncedQuery(v)}
            />
            <OrderBy />

            <div className='hidden md:flex items-center'>
              <Button isIconOnly radius='sm' variant='light' aria-label='Vista de cuadrícula'>
                <LayoutGrid />
              </Button>
              <Button isIconOnly radius='sm' variant='light' aria-label='Vista de lista'>
                <List />
              </Button>
            </div>
          </div>
        </div>

        <LazyMotion features={domAnimation}>
          <div className='w-full container mx-auto flex flex-col gap-12'>
            <section>
              {/* Parent con layout para animar reacomodos */}
              <motion.div
                layout
                transition={spring}
                className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'
                variants={containerVariants}
                initial={false}
                animate='animate'
              >
                <AnimatePresence mode='popLayout'>
                  {products.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      variants={itemVariants}
                      initial='initial'
                      animate='animate'
                      exit='exit'
                      transition={spring}
                      whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ProductItem item={item} isRelated />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Estado vacío con fade */}
              <AnimatePresence>
                {products.length === 0 && (
                  <motion.div
                    key='empty'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='py-16 text-center text-neutral-500'
                  >
                    No se encontraron productos con los filtros actuales.
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </LazyMotion>
      </section>
    </section>
  )
}

export default Catalog
