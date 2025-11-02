import { Button, Input } from '@heroui/react'
import { LayoutGrid, List } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'
import OrderBy from '../components/store/OrderBy'
import ProductItem from '../components/store/ProductItem'
import { selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'

const Catalog: React.FC = () => {
  const products = useSelector(selectProductsWithBestPromo)

  return (
    <section className='w-full flex flex-col md:flex-row  text-neutral-900'>
      {/*MAIN CONTENT*/}
      <section className='flex-1 container mx-auto w-full '>
        <div className='text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 rounded-lg bg-white shadow-lg sticky top-4 z-20 mb-6  '>
          <div className=' flex-wrap items-center gap-2 hidden sm:flex'>
            <Button isIconOnly radius='sm' variant='light' aria-label='Vista de cuadrícula'>
              <LayoutGrid />
            </Button>

            <Button isIconOnly radius='sm' variant='light' aria-label='Vista de lista'>
              <List />
            </Button>
          </div>

          <div className='flex items-center gap-2 flex-col sm:flex-row sm:min-w-md '>
            <Input
              size='sm'
              radius='sm'
              className='text-sm'
              label='Buscar productos'
              isClearable
              variant='bordered'
              classNames={{ inputWrapper: 'border-gray-300' }}
            />

            <OrderBy />
          </div>
        </div>

        <div className='w-full container mx-auto  flex flex-col gap-12'>
          <section>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
              {products.map((item) => (
                <ProductItem item={item} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  )
}

export default Catalog
