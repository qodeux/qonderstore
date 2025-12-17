import { memo } from 'react'
import { SwiperSlide } from 'swiper/react'
import SwipperSlider from '../../components/common/swiper/SwipperSlider'
import ProductItem from '../../components/store/ProductItem'

type RelatedProps = {
  items: any[] // pon tu tipo real
}

export const RelatedProducts = memo(function RelatedProducts({ items }: RelatedProps) {
  return (
    <section className='my-8 w-full'>
      <div className='container mx-auto px-8'>
        <header className='mb-4'>
          <h3 className='text-2xl font-semibold'>Productos relacionados</h3>
        </header>

        <div className='overflow-x-clip max-w-xs sm:max-w-full'>
          <SwipperSlider showProgress showNavigation showPagination autoplay={10000}>
            {items.map((item) => (
              <SwiperSlide key={`related-${item.id}`}>
                <ProductItem item={item} isRelated />
              </SwiperSlide>
            ))}
          </SwipperSlider>
        </div>
      </div>
    </section>
  )
})
