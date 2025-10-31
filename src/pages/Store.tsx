import { Button, Card, CardBody, CardFooter, CardHeader, Select, SelectItem } from '@heroui/react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import React from 'react'

const Store: React.FC = () => {
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
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} shadow='sm' className='border border-neutral-300'>
                {/* Imagen producto */}
                <CardHeader className='p-0'>
                  <div className='w-full aspect-square bg-neutral-100 border-b border-neutral-300 flex items-center justify-center text-neutral-500 text-xs'>
                    {/* TODO: <Image src="" /> si usas @heroui/react Image */}
                    img
                  </div>
                </CardHeader>

                {/* Info producto */}
                <CardBody className='px-3 py-3 text-neutral-900 text-sm leading-tight'>
                  <p className='font-medium text-[13px]'>
                    {item === 1 ? 'Nombre producto' : item === 2 ? 'Biscotti' : item === 3 ? 'Afgan Kush' : 'Extracto 710'}
                  </p>

                  {/* rating */}
                  <div className='flex items-center gap-1 text-[11px] text-neutral-800 mt-1'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className='h-3 w-3 fill-black stroke-black' />
                    ))}
                  </div>

                  {/* price */}
                  <p className='text-[13px] font-semibold text-neutral-900 mt-1'>
                    {item === 1 ? '$199' : item === 2 ? '$5600' : item === 3 ? '$280' : '$6000'}
                  </p>
                </CardBody>

                {/* Controles: select + botón */}
                <CardFooter className='flex items-center gap-2 px-3 pb-4 pt-0'>
                  {/* Select de presentación */}
                  <Select size='sm' className='max-w-[90px] text-[12px]' defaultSelectedKeys={['gramo']} aria-label='Presentación'>
                    <SelectItem key='gramo' className='text-[12px]'>
                      gramo
                    </SelectItem>
                    <SelectItem key='medio' className='text-[12px]'>
                      1/2
                    </SelectItem>
                    <SelectItem key='onza' className='text-[12px]'>
                      onza
                    </SelectItem>
                  </Select>

                  {/* Agregar */}
                  <Button
                    size='sm'
                    radius='sm'
                    className='bg-black text-white text-[12px] leading-none h-auto min-h-[28px] px-2 py-1 hover:bg-neutral-800'
                  >
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
            {[
              { name: 'Flores', count: '20 productos' },
              { name: 'Concentrados', count: '20 productos' },
              { name: 'Comestibles', count: '20 productos' },
              { name: 'Nombre', count: '20 productos' },
              { name: 'Nombre', count: '20 productos' },
              { name: 'Nombre', count: '20 productos' },
              { name: 'Nombre', count: '20 productos' },
              { name: 'Nombre', count: '20 productos' }
            ].map((cat, i) => (
              <Card key={i} shadow='sm' isPressable className='relative aspect-square overflow-hidden border border-neutral-400 p-0'>
                {/* Fondo con gradiente tipo Figma */}
                <div className='absolute inset-0 bg-gradient-to-b from-neutral-200 to-neutral-600' />

                {/* Overlay oscuro de abajo hacia arriba */}
                <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />

                {/* Contenido inferior izquierda */}
                <CardFooter className='absolute bottom-0 left-0 right-0 z-10 flex flex-col items-start bg-transparent text-white p-3'>
                  <p className='text-[13px] font-medium leading-tight text-white'>{cat.name}</p>
                  <p className='text-[11px] leading-tight text-neutral-200'>{cat.count}</p>
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
