import React from 'react'
import { useSelector } from 'react-redux'
import { SwiperSlide } from 'swiper/react'
import MainBanner from '../components/common/swiper/MainBanner'
import SwipperSlider from '../components/common/swiper/SwipperSlider'
import CategoryItem from '../components/store/CategoryItem'
import ProductItem from '../components/store/ProductItem'
import { useTailwindBreakpoint } from '../hooks/useBreakTailwindPoint'
import { selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'
import type { RootState } from '../store/store'

const Store: React.FC = () => {
  const products = useSelector(selectProductsWithBestPromo)
  const categories = useSelector((state: RootState) => state.categories.items)

  const { isLg } = useTailwindBreakpoint()

  return (
    <div className='flex flex-col container mx-auto lg:px-8 2xl:px-0 space-y-6 mb-6'>
      <MainBanner autoplay={5000} showPagination />

      <section className='w-full max-w-screen  px-6 sm:p-0 '>
        <header className='mb-4'>
          <h2 className='text-2xl font-bold text-neutral-900 text-center sm:text-left'>Productos destacados</h2>
        </header>
        <SwipperSlider showProgress showNavigation showPagination autoplay={10000}>
          {products
            .filter((p) => p.featured === true)
            .map((item) => (
              <SwiperSlide key={`feat-${item.id}`}>
                <ProductItem item={item} />
              </SwiperSlide>
            ))}
        </SwipperSlider>
      </section>

      <section className='w-full  max-w-screen  px-6 sm:p-0 '>
        <header className='mb-4'>
          <h2 className='text-2xl font-bold text-neutral-900 text-center sm:text-left'>Explora nuestras categorías</h2>
        </header>

        {!isLg && (
          <SwipperSlider showNavigation showPagination autoplay={3000}>
            {categories
              .filter((c) => c.parent === null && (c.total_products_active ?? 0) > 0)
              .map((cat) => (
                <SwiperSlide key={`cat-${cat.id}`}>
                  <CategoryItem category={cat} key={`cat-${cat.slug_id}`} />
                </SwiperSlide>
              ))}
          </SwipperSlider>
        )}

        {isLg && (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {categories
              .filter((c) => c.parent === null && (c.total_products_active ?? 0) > 0)
              .map((cat) => (
                <CategoryItem category={cat} key={`cat-${cat.slug_id}`} />
              ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Store
