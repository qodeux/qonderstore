import { Button, Card, CardBody } from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'
import CategoryItem from '../components/store/CategoryItem'
import ProductItem from '../components/store/ProductItem'
import { selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'
import type { RootState } from '../store/store'

const Store: React.FC = () => {
  const products = useSelector(selectProductsWithBestPromo)
  const categories = useSelector((state: RootState) => state.categories.items)
  return (
    <main className='w-full flex flex-col'>
      <section className='w-full text-white'>
        <div className='relative w-full max-w-screen-xl mx-auto px-4 py-10 sm:py-14 lg:py-16 flex flex-col items-center'>
          {/* Slide actual del carrusel */}
          <Card
            shadow='sm'
            className='w-full aspect-[16/6] bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center text-sm'
          >
            <CardBody className='flex items-center justify-center p-0'>
              {/* TODO: reemplazar por imagen/banner real */}
              Banner / Carrusel
            </CardBody>
          </Card>

          {/* Flecha izquierda */}
          <Button
            isIconOnly
            size='sm'
            radius='full'
            variant='flat'
            className='!bg-black/50 text-white hover:!bg-black/70 absolute left-2 top-1/2 -translate-y-1/2 min-w-0 w-8 h-8'
            aria-label='Slide anterior'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          {/* Flecha derecha */}
          <Button
            isIconOnly
            size='sm'
            radius='full'
            variant='flat'
            className='!bg-black/50 text-white hover:!bg-black/70 absolute right-2 top-1/2 -translate-y-1/2 min-w-0 w-8 h-8'
            aria-label='Siguiente slide'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>

          {/*Dots del carrusel*/}
          <div className='flex items-center gap-1 mt-4 text-[10px] text-neutral-400'>
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full border border-neutral-400 ${i === 0 ? 'bg-neutral-200' : 'bg-transparent'}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className='w-full container mx-auto px-4 py-10 flex flex-col gap-12'>
        <section>
          <header className='mb-6'>
            <h2 className='text-xl font-semibold text-neutral-900'>Productos destacados</h2>
          </header>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            {products
              .filter((p) => p.featured === true)
              .map((item) => (
                <ProductItem item={item} key={`feat-${item.id}`} />
              ))}
          </div>
        </section>
        <section>
          <header className='mb-6'>
            <h2 className='text-xl font-semibold text-neutral-900'>Explora nuestras categorías</h2>
          </header>

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
            {categories
              .filter((c) => c.parent === null && (c.total_products_active ?? 0) > 0)
              .map((cat) => (
                <CategoryItem category={cat} key={`cat-${cat.slug_id}`} />
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Store
