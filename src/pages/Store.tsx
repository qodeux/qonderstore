import { Button, Card, CardBody, CardFooter, CardHeader } from '@heroui/react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import PresignedImage from '../components/common/cloudflare-r2/PresignedImage'
import { selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'
import type { RootState } from '../store/store'
import { formatMoney } from '../utils/money'

const Store: React.FC = () => {
  const products = useSelector(selectProductsWithBestPromo)
  const categories = useSelector((state: RootState) => state.categories.items)

  console.log(products)

  return (
    <main className='w-full flex flex-col'>
      {/* HERO / CARRUSEL */}
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

      {/*CONTENIDO PRINCIPAL*/}
      <div className='w-full max-w-screen-xl mx-auto px-4 py-10 flex flex-col gap-12'>
        {/*PRODUCTOS DESTACADOS*/}

        <section>
          <header className='mb-6'>
            <h2 className='text-xl font-semibold text-neutral-900'>Productos destacados</h2>
          </header>

          {/* Grid productos destacados */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            {products
              .filter((p) => p.featured === true)
              .map((item) => (
                <Card key={item.id} shadow='sm' className='border border-neutral-300'>
                  {/* Imagen producto */}
                  <CardHeader className='p-0'>
                    <Link to={`/producto/${item.slug}`} className='contents'>
                      <div className='w-full aspect-square bg-neutral-100 border-b border-neutral-300 flex items-center justify-center text-neutral-500 text-xs'>
                        {/* TODO: <Image src="" /> si usas @heroui/react Image */}
                        {item.main_image ? <PresignedImage keyPath={item.main_image} expires={180} /> : 'Sin imagen'}
                      </div>
                    </Link>
                  </CardHeader>

                  {/* Info producto */}
                  <CardBody className='px-3 py-3 text-neutral-900 text-sm leading-tight'>
                    <p className='font-medium text-lg'>{item.name}</p>

                    {/* rating */}
                    <div className='flex items-center gap-1 text-[11px] text-neutral-800 mt-1'>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className='h-3 w-3 fill-black stroke-black' />
                      ))}
                    </div>

                    {/* price */}
                    <div>
                      {item.hasPromotion ? (
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center text-green-600'>Promo -{item.discountPercent}% </div>
                          <div className='flex items-center justify-end gap-2'>
                            <del className='text-sm  mt-1'>{formatMoney(item.price)}</del>
                            <span className='text-2xl font-semibold  mt-1'>{formatMoney(item.finalPrice)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className='text-2xl font-semibold text-neutral-900 mt-1 text-right'>{formatMoney(item.price)}</p>
                      )}
                    </div>
                  </CardBody>

                  {/* Controles: select + botón */}
                  <CardFooter className='flex items-center justify-end gap-2 px-3 pb-4 pt-0'>
                    {/* Agregar */}
                    <Button radius='sm' className='bg-black text-white leading-none hover:bg-neutral-800'>
                      Agregar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </section>

        {/*EXPLORA NUESTRAS CATEGORÍAS*/}
        <section>
          <header className='mb-6'>
            <h2 className='text-xl font-semibold text-neutral-900'>Explora nuestras categorías</h2>
          </header>

          {/* Grid 8 categorías */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-6'>
            {categories
              .filter((c) => c.parent === null)
              .map((cat) => (
                <Card
                  key={cat.slug_id}
                  shadow='sm'
                  isPressable
                  className='relative aspect-square overflow-hidden border border-neutral-400 p-0'
                >
                  <Link to={`/categoria/${cat.slug_id}`}>
                    <figure>
                      {cat.main_image ? (
                        <PresignedImage keyPath={cat.main_image} expires={180} />
                      ) : (
                        //className='absolute inset-0 w-full h-full object-cover'
                        <div className='absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-600' />
                      )}
                    </figure>
                  </Link>

                  {/* Overlay oscuro de abajo hacia arriba */}
                  <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/100 via-black/40 to-transparent' />

                  {/* Contenido inferior izquierda */}
                  <CardFooter className='absolute bottom-0 left-0 right-0 z-10 flex flex-col items-start bg-transparent text-white p-3'>
                    <h4 className='text-xl font-bold leading-tight text-white'>{cat.name}</h4>
                    <p className='text-lg leading-tight text-neutral-200'>{cat.total_products} Productos</p>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Store
