import { Button, Input } from '@heroui/react'
import { ChevronLeft } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router'
import { SwiperSlide } from 'swiper/react'
import SwipperSlider from '../../components/common/swiper/SwipperSlider'
import CategoryItem from '../../components/store/CategoryItem'
import OrderBy from '../../components/store/OrderBy'
import ProductItem from '../../components/store/ProductItem'
import { useDeviceScreen } from '../../hooks/useDeviceScreen'
import { selectProductsWithBestPromo } from '../../store/selectors/productsWithPromo'
import type { RootState } from '../../store/store'

const Category = () => {
  const { slug } = useParams()
  const products = useSelector(selectProductsWithBestPromo)
  const categories = useSelector((state: RootState) => state.categories.items)
  const navigate = useNavigate()
  const { isMobile } = useDeviceScreen()

  const featuredProducts = products
    .filter((p) => p.category === categories.find((c) => c.slug_id == slug)?.name && p.featured === true)
    .sort(() => Math.random() - 0.5)
    .slice(0, isMobile ? 14 : 20)

  const allProducts = products.filter((p) => p.category === categories.find((c) => c.slug_id == slug)?.name && p.featured === false)

  const hasSubcategories = categories.some((c) => c.parent === categories.find((cat) => cat.slug_id == slug)?.id)

  const subcategories = categories.filter((c) => c.parent === categories.find((cat) => cat.slug_id == slug)?.id)

  return (
    <div className='w-full container mx-auto  md:p-8 flex flex-col gap-4 md:gap-8'>
      <header className='mb-6 flex flex-col md:flex-row items-start md:items-center md:justify-between p-6'>
        <div className='mb-6 md:mb-0 '>
          <Button size='md' variant='ghost' onPress={() => navigate(-1)}>
            <ChevronLeft /> <p className='hidden md:block'>Regresar</p>
          </Button>
        </div>
        <h2 className='text-5xl font-bold text-center'>Categoría {categories.find((c) => c.slug_id == slug)?.name}</h2>
        <div></div>
      </header>

      {hasSubcategories && (
        <section className='p-6'>
          <header>
            <h3 className='text-3xl font-bold mb-4'>Subcategorías</h3>
          </header>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6'>
            {subcategories.map((cat) => (
              <CategoryItem category={cat} />
            ))}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className='max-w-screen p-6'>
          <header>
            <h3 className='text-3xl font-bold mb-4 text-center md:text-left'>Productos destacados</h3>
          </header>

          <SwipperSlider showProgress showNavigation showPagination autoplay={10000}>
            {featuredProducts
              .filter((p) => p.featured === true)
              .map((item) => (
                <SwiperSlide key={`feat-${item.id}`}>
                  <ProductItem item={item} />
                </SwiperSlide>
              ))}
          </SwipperSlider>
        </section>
      )}
      {allProducts.length > 0 && (
        <section className='p-6'>
          <header className='mb-6 flex flex-col md:flex-row md:items-center justify-center md:justify-between'>
            <h3 className='text-3xl font-bold my-4 md:mb-0 text-center md:text-left'>Todos los productos</h3>
            <div className='flex flex-col md:flex-row items-center justify-between  w-full md:max-w-md gap-2'>
              <Input label='Buscar ...' size='sm' className='' variant='bordered' classNames={{ inputWrapper: 'bg-white' }} />
              <OrderBy />
            </div>
          </header>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {allProducts.map((item) => (
              <ProductItem item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Category
