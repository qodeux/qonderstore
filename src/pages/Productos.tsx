import { Button, Checkbox, Input, Select, SelectItem, Slider } from '@heroui/react'
import { ArrowUpDown, LayoutGrid, List, X } from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'
import ProductItem from '../components/store/ProductItem'
import { selectProductsWithBestPromo } from '../store/selectors/productsWithPromo'

const Productos: React.FC = () => {
  const products = useSelector(selectProductsWithBestPromo)

  return (
    <main className='w-full flex flex-col md:flex-row bg-white text-neutral-900'>
      {/*SIDEBAR (FILTROS)*/}
      <aside className='w-full md:w-[280px] border-b md:border-b-0 md:border-r border-neutral-300 p-4 md:p-5 shrink-0'>
        {/* Encabezado filtros */}
        <div className='flex items-start justify-between border-b border-neutral-300 pb-4'>
          <h2 className='text-base font-semibold text-neutral-900'>Filtros de búsqueda</h2>

          <Button
            isIconOnly
            size='sm'
            radius='sm'
            variant='light'
            className='text-neutral-700 min-w-0 h-auto p-1'
            aria-label='Cerrar filtros'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>

        <div className='flex flex-col gap-6 pt-4'>
          {/* Buscador */}
          <div className='flex flex-col gap-2'>
            <Input
              size='sm'
              radius='sm'
              className='text-sm'
              placeholder='Buscar'
              // startContent={} si luego quieres un ícono de search
            />

            {/* Checkboxes fila */}
            <div className='flex flex-wrap gap-x-4 gap-y-2 text-[13px]'>
              <Checkbox
                size='sm'
                radius='sm'
                defaultSelected
                classNames={{
                  label: 'text-[13px] text-neutral-900'
                }}
              >
                Ofertas
              </Checkbox>

              <Checkbox
                size='sm'
                radius='sm'
                defaultSelected
                classNames={{
                  label: 'text-[13px] text-neutral-900'
                }}
              >
                Nuevo
              </Checkbox>

              <Checkbox
                size='sm'
                radius='sm'
                defaultSelected
                classNames={{
                  label: 'text-[13px] text-neutral-900'
                }}
              >
                Sale
              </Checkbox>
            </div>
          </div>

          {/* Categorías */}
          <section className='flex flex-col gap-2 text-sm'>
            <h3 className='text-base font-semibold text-neutral-900'>Categorías</h3>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>Concentrados</button>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>Flores</button>

            <button className='text-left px-3 py-2 rounded bg-black text-white text-[13px] leading-none'>Comestibles</button>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>Nombre</button>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>Nombre</button>
          </section>

          {/* Marca */}
          <section className='flex flex-col gap-2 text-sm'>
            <h3 className='text-base font-semibold text-neutral-900'>Marca</h3>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>Fumanchu</button>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>Folklore</button>

            <button className='text-left px-0 py-1 text-[13px] text-neutral-900 hover:underline'>710 Labs</button>
          </section>

          {/* Precio */}
          <section className='flex flex-col gap-3 text-sm'>
            <h3 className='text-base font-semibold text-neutral-900'>Precio</h3>

            {/* Top labels de rango */}
            <div className='flex justify-between text-[11px] text-neutral-900 font-medium'>
              <span>$100</span>
              <span>$50,000</span>
            </div>

            {/* Slider de rango de precio */}
            <Slider
              // TODO: conectar a estado [min,max]
              step={10}
              minValue={100}
              maxValue={50000}
              defaultValue={[100, 50000]} // <- Hero UI soporta array en Slider.range, si tu versión no soporta array, deja [100] o un valor fijo
              aria-label='Rango de precio'
              className='max-w-full'
            />

            {/* Texto rango seleccionado */}
            <div className='flex flex-col gap-2 text-[13px] text-neutral-900'>
              <div className='flex items-start justify-between'>
                <span className='text-[12px] text-neutral-700'>Precio:</span>
                <span className='text-[12px] font-medium'>$100 - $50,000</span>
              </div>

              <Button
                size='sm'
                radius='sm'
                className='bg-black text-white text-[12px] leading-none h-auto min-h-[28px] px-3 py-1 w-fit self-end hover:bg-neutral-800'
              >
                Filtrar
              </Button>
            </div>
          </section>
        </div>
      </aside>

      {/*MAIN CONTENT*/}
      <section className='flex-1 w-full p-4 md:p-6 lg:p-8'>
        {/* ---- Barra superior: ordenar / vista ---- */}
        <div className='w-full border border-neutral-300 bg-neutral-100 text-neutral-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-3 py-3'>
          {/* Izquierda: "Ordenar por" */}
          <div className='flex flex-wrap items-center gap-2 text-[13px]'>
            <span className='text-neutral-900 font-medium'>Ordenar por</span>

            <Select size='sm' radius='sm' className='max-w-[120px] text-[12px]' defaultSelectedKeys={['precio']} aria-label='Ordenar por'>
              <SelectItem key='precio' className='text-[12px]'>
                Precio
              </SelectItem>
              <SelectItem key='nombre' className='text-[12px]'>
                Nombre
              </SelectItem>
              <SelectItem key='rating' className='text-[12px]'>
                Rating
              </SelectItem>
            </Select>

            <Button
              isIconOnly
              size='sm'
              variant='light'
              radius='sm'
              className='text-neutral-900 min-w-0 h-auto p-1'
              aria-label='Cambiar dirección de orden'
            >
              <ArrowUpDown className='w-4 h-4' />
            </Button>
          </div>

          {/* Derecha: Mostrar vista grid/list */}
          <div className='flex items-center gap-2 text-[13px]'>
            <span className='text-neutral-900'>Mostrar</span>

            <Button
              isIconOnly
              size='sm'
              radius='sm'
              variant='light'
              className='text-neutral-900 min-w-0 h-auto p-1'
              aria-label='Vista de cuadrícula'
            >
              <LayoutGrid className='w-4 h-4' />
            </Button>

            <Button
              isIconOnly
              size='sm'
              radius='sm'
              variant='light'
              className='text-neutral-900 min-w-0 h-auto p-1'
              aria-label='Vista de lista'
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/*GRID DE PRODUCTOS*/}

        <div className='w-full container mx-auto px-4 py-10 flex flex-col gap-12'>
          <section>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
              {products.map((item) => (
                <ProductItem item={item} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default Productos
