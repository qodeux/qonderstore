import { Button, Input } from '@heroui/react'
import { ChevronLeft } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router'
import CategoryItem from '../components/store/CategoryItem'
import OrderBy from '../components/store/OrderBy'
import ProductItem from '../components/store/ProductItem'
import { selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'
import type { RootState } from '../store/store'

const Category = () => {
  const { slug } = useParams()
  const products = useSelector(selectProductsWithBestPromo)
  const categories = useSelector((state: RootState) => state.categories.items)
  const navigate = useNavigate()

  const featuredProducts = products.filter((p) => p.category === categories.find((c) => c.slug_id == slug)?.name && p.featured === true)
  const allProducts = products.filter((p) => p.category === categories.find((c) => c.slug_id == slug)?.name && p.featured === false)

  const hasSubcategories = categories.some((c) => c.parent === categories.find((cat) => cat.slug_id == slug)?.id)

  const subcategories = categories.filter((c) => c.parent === categories.find((cat) => cat.slug_id == slug)?.id)

  return (
    <div className='w-full container mx-auto px-4 py-10 flex flex-col gap-12'>
      <header className='mb-6 flex items-center justify-between'>
        <div>
          <Button size='lg' variant='ghost' onPress={() => navigate(-1)}>
            <ChevronLeft /> Regresar
          </Button>
        </div>
        <h2 className='text-5xl font-bold text-center'>Categoría {categories.find((c) => c.slug_id == slug)?.name}</h2>
        <div></div>
      </header>

      {hasSubcategories && (
        <section>
          <header>
            <h3 className='text-3xl font-bold mb-8'>Subcategorías</h3>
          </header>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6'>
            {subcategories.map((cat) => (
              <CategoryItem category={cat} />
            ))}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section>
          <header>
            <h3 className='text-3xl font-bold mb-8'>Productos destacados</h3>
          </header>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            {featuredProducts.map((item) => (
              <ProductItem item={item} />
            ))}
          </div>
        </section>
      )}
      {allProducts.length > 0 && (
        <section>
          <header className='mb-6 flex items-center justify-between'>
            <h3 className='text-3xl font-bold mb-8'>Todos los productos</h3>
            <div className='flex items-center '>
              <Input label='Buscar productos...' size='sm' className='mr-4  w-50' />
              <OrderBy />
            </div>
          </header>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
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
